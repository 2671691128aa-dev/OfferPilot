import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Vite 构建配置
 *
 * - manualChunks：将第三方库拆分为独立 chunk，利用浏览器缓存
 *   - vendor：React 生态（体积最大、最不常变）
 *   - ui：表单和校验库
 * - proxy：开发环境 API 代理到本地后端
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
})
