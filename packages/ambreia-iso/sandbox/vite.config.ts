import {defineConfig} from 'vite';
import {existsSync, readFileSync} from 'fs';
import {resolve} from 'path';

// A room drawn by @ambreia/iso alone, from a zone in the emulator's format (spec §11, J4).
// `pnpm --filter @ambreia/iso sandbox`; the content comes from the asset server, as for the client.
const ASSETS = 'http://vortex-assets.local';

// The client's config.json → asset-packs (key included: a local tool), with `${url.prefix}` dropped so
// the directories are this origin's `/ambreia/<family>/`, proxied below.
const CLIENT_CONFIG = resolve(__dirname, '../../vortex-client/public/config.json');
const ASSET_PACKS = existsSync(CLIENT_CONFIG)
    ? JSON.parse(readFileSync(CLIENT_CONFIG, 'utf8').replaceAll('${url.prefix}', ''))['asset-packs'] ?? {}
    : {};

export default defineConfig({
    root: __dirname,
    define: {__AMBREIA_ASSET_PACKS__: JSON.stringify(ASSET_PACKS)},
    server: {
        port: 5177,
        strictPort: true,
        fs: {allow: [resolve(__dirname, '../../..')]},
        proxy: {
            '/gamedata': {target: ASSETS, changeOrigin: true},
            '/ambreia': {target: ASSETS, changeOrigin: true}
        }
    }
});
