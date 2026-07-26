import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
      // 生产前缀本地联调：/aiteacher/api -> backend
      '/aiteacher/api': {
        target: 'http://127.0.0.1:8000',
        rewrite: (p) => p.replace(/^\/aiteacher/, ''),
      },
    },
  },
})
