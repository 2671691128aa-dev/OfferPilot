import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

/**
 * 全局应用布局组件
 *
 * 统一页面容器：最大宽度 6xl，居中，底部留白
 * 所有子页面通过 <Outlet /> 渲染，不再需要各自设置外层容器
 */
export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      {/* 统一页面容器 — 所有子页面共享 */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}
