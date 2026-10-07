/**
 * Starts the imager alongside a Vite dev server.
 *
 * The client's dev server already proxies `/habbo-imaging` to :8081, so an imager that is not running is
 * not an error anyone sees — it is avatars and badges that silently do not draw, and a second
 * terminal to remember. This plugin removes the second terminal: `pnpm dev` brings the
 * service up itself.
 *
 * It probes the port first rather than owning the process, because both dev servers load this
 * plugin and `pnpm imager` is still the way to run the service on its own. Whoever is already
 * listening keeps the port; the others attach to nothing and let the proxy do the rest.
 * `src/index.ts` handles the remaining race — two dev servers started in the same second both
 * see a free port — by exiting quietly on EADDRINUSE instead of throwing a stack.
 */
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Where `tools/pregenerate.mjs` writes, and where the middleware below reads.
 *
 * Under the asset root when there is one, because that directory is served by something that is
 * always up (Apache, nginx, a CDN) — which is the whole point of baking the images: a hit needs
 * no dev server and no imager. Inside the package otherwise, so the feature works on a machine
 * that fetches its assets over HTTP.
 */
export function imagingRoot()
{
    // The dev server is not the imager and never read its `.env`. `--env-file` semantics: the
    // real environment wins, and an absent file is not an error.
    try
    {
        process.loadEnvFile(resolve(ROOT, '.env'));
    }
    catch
    {
        // No .env — every value below has a default.
    }

    if(process.env.IMAGER_STATIC_ROOT) return resolve(process.env.IMAGER_STATIC_ROOT);
    if(process.env.IMAGER_ASSETS_ROOT) return resolve(process.env.IMAGER_ASSETS_ROOT, 'habbo-imaging');

    return resolve(ROOT, 'static');
}

/**
 * The file name a `/habbo-imaging/…` request bakes to, or `null` for a request that must not be
 * served from disk.
 *
 * One function, imported by both sides, because the generator and the server agreeing on the
 * name is the entire contract — and a baked image nobody looks for is indistinguishable from one
 * that was never baked.
 *
 * The path forms (`badge/x.png`, `furniture/throne.png`, `avatarimage/Bob.png`) are already file
 * names and keep them. The query forms become the sorted parameter list, so the same image asked
 * for with the parameters in a different order is one file and not two. A `figure=` makes that
 * name far longer than Windows tolerates in a path, so anything long collapses to a digest.
 */
export function imagingKey(pathname, params)
{
    const route = pathname.replace(/^\/+/, '').replace(/\/+$/, '');

    // A room's URL names a room, not its contents: it changes whenever someone moves a chair,
    // and it is the one route the imager itself refuses to cache on disk.
    if(route.length === 0 || route.startsWith('room/') || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(route)) return null;

    const query = [...params].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([key, value]) => `${key}-${value}`).join('_');

    if(query.length === 0) return route.endsWith('.png') ? route : null;

    const name = query.replace(/[^A-Za-z0-9._-]/g, '_');

    return `${route}/${name.length > 96 ? createHash('sha1').update(query).digest('hex') : name}.png`;
}

export function imagerServer({port = 8081} = {})
{
    return {
        name: 'vortex-imager-server',

        // Serve-only: `pnpm build` produces static files and has no service to talk to.
        apply: 'serve',

        configureServer(server)
        {
            // Registered here rather than in the returned post-hook on purpose: middlewares added
            // from `configureServer` run BEFORE Vite's internal ones, and the `/habbo-imaging`
            // proxy is one of those. A baked image has to be found before the request leaves for
            // :8081, and anything not baked falls through to it untouched.
            server.middlewares.use('/habbo-imaging', serveBaked(imagingRoot()));

            // Not awaited — the dev server must come up whether or not the imager does.
            void launch(server, port);
        },
    };
}

/**
 * Serves a pre-generated PNG, or gets out of the way.
 *
 * `next()` on anything missing is what keeps this from being a regression: a player who changed
 * their look since the last run, a furni nobody baked, a room — all of them reach the imager and
 * render live, exactly as before. Baking is a fast path, never the only path.
 */
function serveBaked(root)
{
    return (request, response, next) =>
    {
        if(request.method !== 'GET' && request.method !== 'HEAD') return next();

        const url = new URL(request.url, 'http://imager.local');
        const key = imagingKey(url.pathname, url.searchParams);

        if(key === null) return next();

        const file = join(root, key);

        stat(file).then((stats) =>
        {
            if(!stats.isFile()) return next();

            response.setHeader('Content-Type', 'image/png');
            response.setHeader('Content-Length', stats.size);
            response.setHeader('X-Imager-Cache', 'baked');

            if(request.method === 'HEAD') return response.end();

            createReadStream(file).pipe(response);

            // `next()` with no argument, not `.catch(next)`: connect reads an argument as an
            // error and answers 500, where a missing file is the ordinary case here.
        }).catch(() => next());
    };
}

async function launch(server, port)
{
    if(await isListening(port)) return;

    // The bundle, not the sources: esbuild is what rewrites `pixi.js` to the Node shim, and
    // rebuilding it here is what keeps a stale `dist/` from being served for weeks. It costs a
    // few seconds, off the critical path of the dev server that spawned it.
    if(await run(process.execPath, [resolve(ROOT, 'tools/build.mjs')]) !== 0)
    {
        server.config.logger.warn('[imager] build failed — /habbo-imaging will not answer');

        return;
    }

    const child = spawn(process.execPath, [resolve(ROOT, 'dist/index.js')], {
        cwd: ROOT,
        stdio: 'inherit',
        env: process.env,
    });

    const stop = () => child.kill();

    server.httpServer?.once('close', stop);
    process.once('exit', stop);
}

function isListening(port)
{
    // `localhost`, matching the proxy target in both vite configs: the service binds whichever
    // family that name resolves to here, and a probe on the other one would report it down.
    return fetch(`http://localhost:${port}/health`, {signal: AbortSignal.timeout(1000)})
        .then(() => true)
        .catch(() => false);
}

function run(command, args)
{
    return new Promise((done) =>
    {
        spawn(command, args, {cwd: ROOT, stdio: 'inherit', env: process.env}).on('exit', done);
    });
}
