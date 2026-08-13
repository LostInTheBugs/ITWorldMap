import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'ITWorldMap',
        short_name: 'ITWorldMap',
        description: 'Carte du monde interactive — données World Bank par année, comparaison de pays, câbles sous-marins.',
        theme_color: '#0b2e59',
        background_color: '#0b2e59',
        display: 'standalone',
        start_url: '/',
        lang: 'fr',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,geojson,svg,png,ico,woff2}'],
        // Tuiles OSM : cache local borné (frais 30 j, 800 max) — l'app reste utilisable
        // hors-ligne après la première visite.
        runtimeCaching: [
          {
            urlPattern: /\.(png|jpg|jpeg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'itwm-tiles',
              expiration: { maxEntries: 800, maxAgeSeconds: 30 * 24 * 3600 },
            },
          },
        ],
        navigateFallback: '/index.html',
      },
    }),
  ],
  base: process.env.VITE_BASE ?? '/',
})
