import {defineConfig} from 'vite';
import {resolve} from 'path';

// A room drawn by @ambreia/iso alone, from a zone in the emulator's format (spec §11, J4).
// `pnpm --filter @ambreia/iso sandbox`; the content comes from the asset server, as for the client.
const ASSETS = 'http://vortex-assets.local';

export default defineConfig({
    root: __dirname,
    server: {
        port: 5177,
        strictPort: true,
        fs: {allow: [resolve(__dirname, '../../..')]},
        proxy: {
            '/gamedata': {target: ASSETS, changeOrigin: true},
            '/dcr': {target: ASSETS, changeOrigin: true},
            '/gordon': {target: ASSETS, changeOrigin: true},
            '/packs': {target: ASSETS, changeOrigin: true}
        }
    }
});
