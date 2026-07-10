import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import LoadingState from '../components/LoadingState'

// ─── 路由懒加载（代码分割） ───
// 每个页面独立打包，首次访问时才加载，减少首屏 JS bundle 体积

const Home = lazy(() => import('../pages/Home'))
const CreateResume = lazy(() => import('../pages/CreateResume'))
const Resume = lazy(() => import('../pages/Resume'))
const Optimize = lazy(() => import('../pages/Optimize'))
const Analyze = lazy(() => import('../pages/Analyze'))
const Interview = lazy(() => import('../pages/Interview'))
const Export = lazy(() => import('../pages/Export'))

/**
 * 路由配置
 *
 * 所有页面组件通过 React.lazy() 实现按需加载，
 * 配合 Suspense 的 fallback 显示加载状态。
 */
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: (
          <Suspense fallback={<LoadingState />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: '/create',
        element: (
          <Suspense fallback={<LoadingState />}>
            <CreateResume />
          </Suspense>
        ),
      },
      {
        path: '/resume',
        element: (
          <Suspense fallback={<LoadingState />}>
            <Resume />
          </Suspense>
        ),
      },
      {
        path: '/optimize',
        element: (
          <Suspense fallback={<LoadingState />}>
            <Optimize />
          </Suspense>
        ),
      },
      {
        path: '/analyze',
        element: (
          <Suspense fallback={<LoadingState />}>
            <Analyze />
          </Suspense>
        ),
      },
      {
        path: '/interview',
        element: (
          <Suspense fallback={<LoadingState />}>
            <Interview />
          </Suspense>
        ),
      },
      {
        path: '/export',
        element: (
          <Suspense fallback={<LoadingState />}>
            <Export />
          </Suspense>
        ),
      },
    ],
  },
])

export default router
