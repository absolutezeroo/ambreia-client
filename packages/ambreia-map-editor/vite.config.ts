import {defineConfig} from 'vite';

// The editor talks to the emulator's web API through this proxy: same origin, so the session
// cookie works without CORS. Tauri dev loads this server, so the proxy covers the app too.
export default defineConfig({
    clearScreen: false,
    server: {
        port: 5174,
        strictPort: true,
        proxy: {'/api': {target: process.env.AMBREIA_API ?? 'http://127.0.0.1:8080', changeOrigin: true}}
    }
});
