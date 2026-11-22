import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: 'echo-news-english',
        name: 'Echo 听讯 · 每日英语新闻听力',
        short_name: 'Echo 听讯',
        description: '每天用 AI 前沿与国际时政新闻练英语听力：逐句朗读、跟读、盲听、收藏。',
        lang: 'zh-CN',
        theme_color: '#0f0e0c',
        background_color: '#0f0e0c',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        categories: ['education', 'news'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: 'index.html',
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.includes('/news/') && url.pathname.endsWith('.json'),
          handler: 'NetworkFirst',
          options: { cacheName: 'news', networkTimeoutSeconds: 6, expiration: { maxEntries: 40 } },
        }],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
