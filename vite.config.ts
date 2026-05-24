import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
      },
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
      },
      '/minio': {  // Используйте без rewrite
        target: 'http://127.0.0.1:9001',
        changeOrigin: true,
        ws: true,
        // НЕ используйте rewrite, оставьте /minio в пути
      },
      '/storage': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
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
