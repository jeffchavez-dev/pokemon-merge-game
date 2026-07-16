import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Without these, a new deploy's service worker installs but stays
      // "waiting" until every tab for the site is closed — a plain reload
      // keeps serving the old cached JS/CSS from the outgoing worker, which
      // is why fixes can appear on a fresh preview URL but not on the
      // stable domain until you close all its tabs.
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'Pokemon Merge',
        short_name: 'Pokemon',
        description: 'Merge Pokémon to discover new evolutions.',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3006,
  },
})