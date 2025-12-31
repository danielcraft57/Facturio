import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  const isProd = mode === 'production'
  const env = loadEnv(mode, process.cwd(), '')

  return {
  plugins: [react()],
  server: {
      port: 5173,
    proxy: {
      '/api': {
          target: env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-mui': ['@mui/material', '@mui/icons-material', '@mui/system'],
            'vendor-charts': ['chart.js', 'react-chartjs-2']
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: !isProd, // Pas de sourcemap en production
      minify: isProd ? 'terser' : false, // Minification seulement en prod
    },
    define: {
      __DEV__: JSON.stringify(isDev),
      __PROD__: JSON.stringify(isProd),
    }
  }
})
