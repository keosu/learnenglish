import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'ContextFlow - 科技职场英语',
        short_name: 'ContextFlow',
        description: '在真实科技工作场景中学习英语表达',
        theme_color: '#193d32',
        background_color: '#f5f7f3',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: { navigateFallback: 'index.html' },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
