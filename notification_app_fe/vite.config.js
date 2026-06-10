import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/evaluation-api': {
        target: 'http://4.224.186.213',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/evaluation-api/, '')
      }
    }
  }
})
