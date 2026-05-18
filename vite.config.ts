import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    open: false,
    hmr: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: false,
      }
    },
    allowedHosts: [
      'daybreak-repose-shortlist.ngrok-free.dev',
      '.ngrok-free.dev',
      'localhost'
    ]
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'axios', 'zustand'],
  },
})
