import {defineConfig, type Plugin} from 'vite';
import {resolve} from 'path';
import {existsSync, readdirSync, readFileSync, statSync, writeFileSync} from 'fs';

/**
 * Dev-server middleware.
 *
 * - `POST /glaze/save { name, xml }` writes an edited layout back to the client's
 *   source `window-layouts/<name>.xml`. `name` is restricted to the AS3 asset-name
 *   charset and the resolved path is confined to the layouts directory (no
 *   traversal).
 * - `GET /glaze/layouts` returns every source layout **newer than the shipped
 *   `assets-xml.ambreia`**. The editor loads its layouts from that prebuilt bundle
 *   while Save writes to the sources, so without this a saved layout was still the
 *   old one after a page reload — a re-theme, or any other edit, never came back.
 *   Normally the list is empty; after a save it holds the one file that changed.
 */
function glazeSavePlugin(): Plugin
{
    const layoutsDir = resolve(__dirname, '../vortex-client/src/assets/window-layouts');

    /**
     * Vortex's own layouts, which are NOT in `window-layouts/`.
     *
     * That directory is gitignored and rewritten wholesale by `build-window-assets.mjs`, so a
     * layout with no counterpart in the Flash dump lives in `vortex-layouts/` instead and is the
     * real source. Saving one into `window-layouts/` looked like it worked and was wiped by the
     * next asset build, while the file the client actually reads never changed.
     */
    const vortexLayoutsDir = resolve(__dirname, '../vortex-client/src/vortex-layouts');
    const xmlBundle = resolve(__dirname, '../vortex-client/public/assets-xml.ambreia');

    /** Where a layout came from: its own directory if it has one there, else the dump's. */
    const dirFor = (name: string): string =>
        existsSync(resolve(vortexLayoutsDir, `${name}.xml`)) ? vortexLayoutsDir : layoutsDir;

    return {
        name: 'glaze-save',
        configureServer(server)
        {
            server.middlewares.use('/glaze/layouts', (req, res) =>
            {
                res.setHeader('Content-Type', 'application/json');

                try
                {
                    let bundleTime = 0;

                    try
                    {
                        bundleTime = statSync(xmlBundle).mtimeMs;
                    }
                    catch
                    {
                        bundleTime = 0; // no bundle built yet — everything counts as newer
                    }

                    // The dump's layouts are IN the bundle, so only the ones edited since it was
                    // built need sending. Vortex's own are in NO bundle — the client reaches them
                    // through an `import.meta.glob` at build time — so "newer than the bundle" is
                    // the wrong question for them and they always come. Filtering them the same way
                    // is why the fishing strip could not be opened in the editor at all.
                    const collect = (dir, always) =>
                        readdirSync(dir)
                            .filter((file) => file.endsWith('.xml'))
                            .filter((file) => always || statSync(resolve(dir, file)).mtimeMs > bundleTime)
                            .map((file) => ({
                                name: file.replace(/\.xml$/, ''),
                                xml: readFileSync(resolve(dir, file), 'utf8')
                            }));

                    const files = [
                        ...collect(layoutsDir, false),
                        ...collect(vortexLayoutsDir, true)
                    ];

                    res.statusCode = 200;
                    res.end(JSON.stringify({files}));
                }
                catch (error)
                {
                    res.statusCode = 500;
                    res.end(JSON.stringify({message: String(error), files: []}));
                }
            });

            server.middlewares.use('/glaze/save', (req, res) =>
            {
                if(req.method !== 'POST')
                {
                    res.statusCode = 405;
                    res.end('Method Not Allowed');

                    return;
                }

                let body = '';

                req.on('data', (chunk) => { body += chunk; });
                req.on('end', () =>
                {
                    res.setHeader('Content-Type', 'application/json');

                    try
                    {
                        const {name, xml} = JSON.parse(body) as { name?: unknown; xml?: unknown };

                        if(typeof name !== 'string' || !/^[A-Za-z0-9_]+$/.test(name) || typeof xml !== 'string')
                        {
                            res.statusCode = 400;
                            res.end(JSON.stringify({message: 'Invalid name or xml'}));

                            return;
                        }

                        const targetDir = dirFor(name);
                        const file = resolve(targetDir, `${name}.xml`);

                        if(!file.startsWith(targetDir))
                        {
                            res.statusCode = 400;
                            res.end(JSON.stringify({message: 'Bad path'}));

                            return;
                        }

                        writeFileSync(file, xml, 'utf8');
                        res.statusCode = 200;
                        res.end(JSON.stringify({message: `Saved ${name}.xml`}));
                    }
                    catch (error)
                    {
                        res.statusCode = 500;
                        res.end(JSON.stringify({message: String(error)}));
                    }
                });
            });
        }
    };
}

/**
 * vortex-glaze — Vite config.
 *
 * Glaze imports only the @ambreia/* packages (the window system, nothing of the engine or the
 * client). One thing it shares with vortex-client is data, not code:
 *  - `publicDir` points at vortex-client's built `public/` so the two
 *    `.ambreia` bundles are served at glaze's root exactly as they are for the
 *    client. Run `pnpm --filter vortex-client build:bundle` (or `pnpm --filter
 *    vortex-glaze bundle`) once if they are missing.
 */
export default defineConfig({
    plugins: [glazeSavePlugin()],
    server: {
        port: 5174,
        strictPort: true,

        // The same asset-host roots vortex-client proxies, for the same reason: asset URLs are
        // relative to whichever origin served the page, so that origin has to forward them.
        proxy: {
            '/c_images': {target: 'http://vortex-assets.local', changeOrigin: true},
            '/gamedata': {target: 'http://vortex-assets.local', changeOrigin: true},
            '/gordon': {target: 'http://vortex-assets.local', changeOrigin: true},
            '/dcr': {target: 'http://vortex-assets.local', changeOrigin: true},
        },
    },
    publicDir: resolve(__dirname, '../vortex-client/public'),
    resolve: {
        alias: {
            '@/assets': resolve(__dirname, 'src/assets'),
            '@': resolve(__dirname, 'src'),
            '@ui': resolve(__dirname, 'src'),
        },
    },
    build: {
        target: 'ES2022',
        sourcemap: true,
    },
    esbuild: {
        tsconfigRaw: {
            compilerOptions: {
                experimentalDecorators: true,
            },
        },
    },
});
