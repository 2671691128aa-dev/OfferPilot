import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

/**
 * 全局应用布局组件
 *
 * 不再统一包裹容器，让每个页面自行控制宽度和间距。
 * Navbar 和 Footer 保持全宽，子页面各自定义 max-w 和 padding。
 */
export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
