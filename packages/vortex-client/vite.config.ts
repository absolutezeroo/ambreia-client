import {defineConfig} from 'vite';
import {resolve} from 'path';
import {engineBundle} from './tools/vite-plugin-engine-bundle.mjs';
import {perfLog} from './tools/vite-plugin-perf-log.mjs';
import {imagerServer} from '../vortex-imager/tools/vite-plugin-imager.mjs';

const ENGINE_SRC = resolve(__dirname, '../vortex-engine/src');

// In dev, `@core`/`@habbo`/`@room`/`@iid` are resolved by the engineBundle plugin instead of by
// `resolve.alias`, which serves the whole engine as ~3,970 separate HTTP modules. They cannot be
// declared here as well: vite:alias runs before user `enforce: 'pre'` plugins, so an alias would
// rewrite the specifier to the engine source before the plugin ever sees it.
const engineAliases = (enabled: boolean) => enabled
    ? {
        '@core': resolve(ENGINE_SRC, 'core'),
        '@habbo': resolve(ENGINE_SRC, 'habbo'),
        '@iid': resolve(ENGINE_SRC, 'iid'),
    }
    : {};

export default defineConfig(({command}) => ({
    // Serve-only, and only so packages/vortex-web can PROXY this dev server instead of the site
    // pointing a phone at a second open port. A proxied Vite server needs a base: its HTML asks for
    // `/src/index.ts`, `/@vite/client`, `/node_modules/.vite/…` at the ROOT, and under a proxy those
    // resolve against the proxying origin — where another Vite answers with its own modules. With a
    // base they are all asked for under `/client/`, which is the only path vortex-web forwards.
    //
    // The cost is local: running this package directly is `http://localhost:5173/client/`, not `/`.
    // `pnpm build` is untouched — production serves the client at its own root.
    base: command === 'serve' ? '/client/' : '/',

    plugins: [
        // serve-only; `pnpm build` keeps the plain alias-driven resolution below
        engineBundle({
            clientRoot: __dirname,
            engineRoot: resolve(__dirname, '../vortex-engine'),
        }),
        // serve-only; receives `:stresstest` runs and writes them to <repo>/perf
        perfLog({repoRoot: resolve(__dirname, '../..')}),
        // serve-only; brings up packages/vortex-imager unless something already holds :8081, so
        // the `/habbo-imaging` proxy below has a service to reach without a second terminal
        imagerServer(),
    ],
    // The text engine is reached through a subpath export from inside the
    // engine bundle, which Vite's dep scanner does not crawl — without this it
    // serves a 404 for the optimised chunk.
    optimizeDeps: {
        include: ['truffle-text/generative'],
        // Their WASM is fetched relative to the module that owns it. Bundled
        // into a dep chunk, that URL points at `.vite/deps/`, where the file is
        // not — and under a base the SPA fallback answers with index.html, so
        // the loader reports a corrupt module rather than a 404.
        exclude: ['harfbuzzjs', '@zkl2333/freetype-wasm'],
        // truffle-text and harfbuzzjs both `await` at module top level, which
        // the optimiser's default es2020 target refuses outright — the dev
        // server exits rather than serving a broken chunk.
        esbuildOptions: {target: 'esnext'},
    },
    resolve: {
        alias: {
            '@/assets': resolve(__dirname, 'src/assets'),
            '@': resolve(__dirname, 'src'),
            ...engineAliases(command === 'build'),
            '@ui': resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 5173,
        strictPort: true,
        proxy: {
            '/webapi': {
                target: 'http://ovarkladwpokgvd718w5.72.60.91.223.sslip.io',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/webapi/, ''),
            },
            '/c_images': {target: 'http://vortex-assets.local', changeOrigin: true},
            '/gamedata': {target: 'http://vortex-assets.local', changeOrigin: true},
            '/gordon': {target: 'http://vortex-assets.local', changeOrigin: true},
            '/dcr': {target: 'http://vortex-assets.local', changeOrigin: true},
            '/habbo-imaging': {target: 'http://localhost:8081', changeOrigin: true},
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
}));
