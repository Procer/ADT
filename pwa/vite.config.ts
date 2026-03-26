import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.ts',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
            manifest: {
                name: 'ANKA Chofer',
                short_name: 'ANKA',
                description: 'Asistente Digital de Transporte - Chofer',
                theme_color: '#0a0a0b',
                background_color: '#0a0a0b',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'pwa-icon.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'pwa-icon.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            }
        })
    ],
    server: {
        host: '0.0.0.0',
        port: 5174,
        strictPort: true
    }
});
