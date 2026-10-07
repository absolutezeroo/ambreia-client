import {defineConfig} from 'vite';
import {resolve} from 'path';

// The window system on its own, fed by the client's asset bundles (spec §11: a host other than the
// engine). `pnpm --filter @ambreia/ui sandbox`; the bundles come from `pnpm --filter vortex-client build:bundle`.
export default defineConfig({
    root: __dirname,
    publicDir: resolve(__dirname, '../../vortex-client/public'),
    server: {port: 5176, strictPort: true, fs: {allow: [resolve(__dirname, '../../..')]}}
});
