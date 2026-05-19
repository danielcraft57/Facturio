import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  const isProd = mode === 'production'
  const env = loadEnv(mode, process.cwd(), '')
  // Backend ciblé par le proxy Vite.
  // - En dev : toujours localhost:3000 (sauf si VITE_API_PROXY_TARGET est défini explicitement)
  // - En build/prod : on se base sur VITE_API_URL (domaine public), sinon fallback sur localhost.
  const proxyTargetRaw = isDev
    ? (env.VITE_API_PROXY_TARGET || 'http://localhost:3000')
    : (env.VITE_API_URL?.replace(/\/api\/?$/, '') || env.VITE_API_PROXY_TARGET || 'http://localhost:3000')

  const proxyTarget = proxyTargetRaw.replace(/\/$/, '')

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
          // En dev, on proxy /api vers le backend local pour éviter le CORS.
          // En prod, ce proxy n'est pas utilisé (build statique).
          // Pour forcer un autre backend en dev : VITE_API_PROXY_TARGET=http://node13.lan:3000
          target: proxyTarget,
        changeOrigin: true,
        configure: (proxy) => {
          let lastProxyErrorLog = 0
          proxy.on('error', (err, _req, res) => {
            const now = Date.now()
            if (now - lastProxyErrorLog > 15_000) {
              lastProxyErrorLog = now
              console.warn(
                `[vite proxy] Backend injoignable (${proxyTarget}). Démarrez le serveur Nest : cd server && npm run start:dev`,
              )
              console.warn(`[vite proxy] Détail :`, err.message)
            }
            if (res && !res.headersSent && 'writeHead' in res) {
              res.writeHead(503, { 'Content-Type': 'application/json' })
              res.end(
                JSON.stringify({
                  success: false,
                  message: 'API indisponible — vérifiez que le backend tourne sur le port 3000.',
                }),
              )
            }
          })
        },
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
