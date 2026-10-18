import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Siguiendo Huellas',
        short_name: 'SiguiendoHuellas',
        description: 'SIG Dinámico Comunitario de Mascotas - Tres de Febrero',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
