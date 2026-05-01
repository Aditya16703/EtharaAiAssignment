import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // In dev: proxy /api to local backend (VITE_API_URL defaults to /api)
  // In production Docker build: nginx handles the proxy — no Vite proxy needed
  const apiTarget = env.VITE_API_BACKEND_URL || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      // Chunk splitting left to defaults
      rollupOptions: {},
      sourcemap: false,
      minify: 'esbuild',
    },
    preview: {
      port: 4173,
    },
  }
})
