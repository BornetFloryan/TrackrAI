import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/trackrapi': {
        target: 'http://trackr-api:4567',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://analyze:6000',
        ws: true,
        changeOrigin: true,
      },
    }
  }
})
