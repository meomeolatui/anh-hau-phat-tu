import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Anh Hậu Phật Tử — Hành hương núi Bà Đen',
        short_name: 'Anh Hậu Phật Tử',
        description: 'Game 3D hành hương núi Bà Đen: niệm Phật, thắp hương, quét lá sân chùa, thỉnh chuông, thiền trên đỉnh núi.',
        lang: 'vi',
        start_url: '/',
        display: 'fullscreen',
        orientation: 'any',
        background_color: '#faf7f2',
        theme_color: '#1a6055',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
        // API & WebSocket của máy chủ online không đi qua service worker
        navigateFallbackDenylist: [/^\/api\//, /^\/ws/],
      },
    }),
  ],
  // Chơi online khi phát triển: chạy `npm run server` (cổng 5200), Vite chuyển tiếp /api và /ws sang đó
  server: {
    proxy: {
      '/api': 'http://localhost:5200',
      '/ws': { target: 'ws://localhost:5200', ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    // _archive/ chứa bản web app cũ (đã ngừng dùng) — không chạy test của nó
    exclude: [...configDefaults.exclude, '_archive/**'],
    css: false,
  },
})
