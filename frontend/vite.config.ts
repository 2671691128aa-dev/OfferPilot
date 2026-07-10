import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Vite 构建配置
 *
 * - manualChunks：将第三方库拆分为独立 chunk，利用浏览器缓存
 *   - react-vendor：React 生态（react/react-dom/react-router-dom，最不常变）
 *   - vendor：其他第三方库（zod、react-hook-form 等）
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
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            return 'vendor'
          }
        },
      },
    },
  },
})
