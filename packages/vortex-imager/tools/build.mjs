#!/usr/bin/env node
/**
 * Bundles the imager into a single ESM file.
 *
 * The bundle step is not a packaging convenience — it is what lets the service run the
 * *client's own* avatar pipeline. `esbuild`'s `alias` rewrites every `pixi.js` import in
 * the engine's transitive graph to the Node shim in `src/shim/pixi.ts`, which no Node
 * module resolution could do (the engine resolves `pixi.js` from its own node_modules).
 *
 * Everything with a native binding or a CJS-only entry stays external so Node loads it
 * normally at runtime.
 */
import {build, context} from 'esbuild';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

/** Packages Node must load itself: native addons, or CJS entries esbuild should not inline. */
const EXTERNAL = [
    '@napi-rs/canvas',
    'mysql2',
    'mysql2/promise',
    'fastify',
    'linkedom',
    'lru-cache'
];

const options = {
    entryPoints: [resolve(ROOT, 'src/index.ts')],
    outfile: resolve(ROOT, 'dist/index.js'),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    sourcemap: true,
    logLevel: 'info',
    external: EXTERNAL,
    tsconfig: resolve(ROOT, 'tsconfig.json'),
    alias: {
        'pixi.js': resolve(ROOT, 'src/shim/pixi.ts')
    }
};

if(process.argv.includes('--watch'))
{
    const ctx = await context(options);

    // `watch()` runs the first build before it resolves, so the bundle exists by the time the
    // service is started below.
    await ctx.watch();

    console.log('[vortex-imager] watching for changes…');

    // Two watchers, one command: esbuild rewrites `dist/index.js`, and Node's own `--watch`
    // restarts the service when it does. Nothing else here needs a process manager, and a
    // rebuild that does not restart is a dev server that silently serves stale code.
    //
    // A restart re-downloads the figure map and the mandatory libraries — about 12s against a
    // remote asset host, near-instant with `IMAGER_ASSETS_ROOT` set.
    const service = spawn(
        process.execPath,
        ['--watch', '--enable-source-maps', resolve(ROOT, 'dist/index.js')],
        {stdio: 'inherit', env: process.env}
    );

    const stop = () => service.kill();

    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);

    service.on('exit', async (code) =>
    {
        await ctx.dispose();

        process.exit(code ?? 0);
    });
}
else
{
    await build(options);
}
