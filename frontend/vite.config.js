import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In development the FastAPI server runs separately; in production both share one origin
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
