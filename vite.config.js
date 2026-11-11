import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves a project site at https://<username>.github.io/<repo-name>/,
// so every asset URL must start with /<repo-name>/. The deploy workflow passes the
// real repo name in VITE_BASE; locally we fall back to the default repo name.
const REPO_NAME = 'Fishing-Guide';
const base = process.env.VITE_BASE || `/${REPO_NAME}/`;

export default defineConfig({
  base,
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/@firebase') || id.includes('node_modules/firebase') ? 'firebase' : undefined),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Fishing Guide',
        short_name: 'Fishing Guide',
        description: 'Beginner-friendly fishing log, map and guide for Clarksville, TN and Severn & Elkridge, MD.',
        theme_color: '#0f766e',
        background_color: '#f0fdfa',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The app shell (HTML/JS/CSS/icons) is precached so the app opens with no signal.
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Map tiles: keep the ones you've viewed so the map still shows at the bank.
            // Covers every basemap style: OSM, OpenTopoMap and Esri (map, satellite, night, labels).
            urlPattern: /^https:\/\/([abc]\.)?tile\.openstreetmap\.org\/|^https:\/\/[abc]\.tile\.opentopomap\.org\/|^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/.*\/MapServer\/tile\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Spot photos (Wikimedia Commons thumbnails) and Esri aerial snapshots.
            urlPattern: /^https:\/\/(commons\.wikimedia\.org\/wiki\/Special:FilePath|upload\.wikimedia\.org|thumb\.wikimedia\.org|server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/export)/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'spot-photos',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/(api|archive-api)\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'open-meteo',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 3 },
            },
          },
          {
            urlPattern: /^https:\/\/waterservices\.usgs\.gov\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'usgs',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 2 },
            },
          },
        ],
      },
    }),
  ],
});
