import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API calls during dev to the .NET backend
    proxy: {
      '/api': 'http://localhost:5001'
    }
  }
})
