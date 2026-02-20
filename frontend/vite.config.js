import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/players': 'http://localhost:8000',
      '/tournaments': 'http://localhost:8000',
      '/matches': 'http://localhost:8000',
    },
  },
})
