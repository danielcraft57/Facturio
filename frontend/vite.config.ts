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
      host: '0.0.0.0',
      allowedHosts: ['node13.lan', 'localhost', '.lan', 'facturio.danielcraft.fr', 'devis.danielcraft.fr', 'facture.danielcraft.fr', '.danielcraft.fr'],
      hmr: isDev && (env.VITE_HMR_HOST || env.VITE_HMR_CLIENT_PORT)
        ? {
            host: env.VITE_HMR_HOST || 'facturio.danielcraft.fr',
            clientPort: parseInt(env.VITE_HMR_CLIENT_PORT || '443', 10),
            protocol: (env.VITE_HMR_PROTOCOL as 'wss' | 'ws') || 'wss',
          }
        : true,
    proxy: {
      '/api': {
          // En dev, toujours utiliser le backend local (node13.lan:3000 ou localhost:3000)
          // En prod (build), cette config n'est pas utilisée (les requêtes vont directement vers VITE_API_URL)
          target: isDev ? 'http://localhost:3000' : (env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'),
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
