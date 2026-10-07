import {resolve} from 'path';
import {defineConfig} from 'vite';

// The editor talks to the emulator's web API and to vortex-imager through this proxy: same
// origin, so the session cookie works without CORS and the furni images can be read back for
// picking. Tauri dev loads this server, so the proxy covers the app too.
//
// The window system's skins, layouts and fonts are the client's asset bundles
// (vortex-client/public/assets-*.bundle, `pnpm --filter vortex-client build:bundle`), served as
// this page's public files the way Glaze and the ui sandbox serve them.
export default defineConfig({
    clearScreen: false,
    publicDir: resolve(__dirname, '../vortex-client/public'),
    server: {
        port: 5178,
        strictPort: true,
        fs: {allow: [resolve(__dirname, '../..')]},
        proxy: {
            '/api': {target: process.env.AMBREIA_API ?? 'http://127.0.0.1:8080', changeOrigin: true},
            '/habbo-imaging': {target: process.env.AMBREIA_IMAGER ?? 'http://127.0.0.1:8081', changeOrigin: true},
            // The room engine's content (@ambreia/iso): furnidata and the furni themselves.
            '/gamedata': {target: process.env.AMBREIA_ASSETS ?? 'http://vortex-assets.local', changeOrigin: true},
            '/dcr': {target: process.env.AMBREIA_ASSETS ?? 'http://vortex-assets.local', changeOrigin: true},
            '/gordon': {target: process.env.AMBREIA_ASSETS ?? 'http://vortex-assets.local', changeOrigin: true}
        }
    }
});
