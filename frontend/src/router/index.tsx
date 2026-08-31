import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import LoadingState from '../components/LoadingState'

// ─── 路由懒加载（代码分割） ───
// 每个页面独立打包，首次访问时才加载，减少首屏 JS bundle 体积

const Login = lazy(() => import('../pages/Login'))
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
 * /login 公开访问，其余页面通过 ProtectedRoute 守卫。
 */
const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingState />}>
        <Login />
      </Suspense>
    ),
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingState />}>
              <Home />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/create',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingState />}>
              <CreateResume />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/resume',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingState />}>
              <Resume />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/optimize',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingState />}>
              <Optimize />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/analyze',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingState />}>
              <Analyze />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/interview',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingState />}>
              <Interview />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/export',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingState />}>
              <Export />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
])

export default router
