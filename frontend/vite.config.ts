import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appName = env.VITE_APP_NAME || 'Gestão de Entregas'
  const appShortName =
    env.VITE_APP_SHORT_NAME || (appName.length > 12 ? 'Entregas' : appName)

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        includeAssets: [
          'favicon.png',
          'favicon.svg',
          'app-logo.png',
          'pwa-icon-192.png',
          'pwa-icon-512.png',
          'notification-sw.js',
        ],
        manifest: {
          name: appName,
          short_name: appShortName,
          description: 'Gestão de entregas, rotas e prestação de contas',
          theme_color: '#6366f1',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          lang: 'pt-BR',
          start_url: '/',
          icons: [
            {
              src: 'pwa-icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined
            }

            if (id.includes('recharts') || id.includes('d3-')) {
              return 'recharts'
            }

            if (id.includes('framer-motion')) {
              return 'framer-motion'
            }

            if (id.includes('@tanstack/react-query')) {
              return 'query'
            }

            if (
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('/react/')
            ) {
              return 'react-vendor'
            }

            return 'vendor'
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          'src/main.tsx',
          'src/app/**',
          'src/layouts/**',
          'src/**/pages/**',
          'src/**/index.ts',
          'src/features/accounting/components/**',
          'src/features/deliveries/components/**',
          'src/features/pending/components/**',
          'src/features/reports/components/**',
        ],
        thresholds: {
          statements: 90,
          branches: 80,
          functions: 90,
          lines: 90,
        },
      },
    },
  }
})
