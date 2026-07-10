import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/create', label: 'AI简历' },
  { path: '/optimize', label: '简历优化' },
  { path: '/analyze', label: '岗位分析' },
  { path: '/interview', label: '模拟面试' },
  { path: '/export', label: '导出' },
]

/**
 * 全局导航栏组件
 * 毛玻璃效果 + 滚动隐藏 + 移动端响应式菜单
 */
export default function Navbar() {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastScroll = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY
      if (current > 80 && current > lastScroll.current) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      lastScroll.current = current
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setHidden(false)
    setMobileOpen(false)
  }, [pathname])

  return (
    <nav
      className={`glass sticky top-0 z-50 transition-all duration-300 ease-in-out ${
        hidden ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-light shadow-md shadow-primary/20">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m0 0a14.926 14.926 0 0 1-5.395-.796"
              />
            </svg>
          </div>
          <span className="text-base font-extrabold tracking-tight text-ink">OfferPilot</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-ink-muted hover:bg-black/5 hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* CTA + Mobile toggle */}
        <div className="flex items-center gap-3">
          <Link
            to="/create"
            className="btn-shine hidden rounded-lg bg-gradient-to-r from-primary to-primary-light px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/15 transition hover:shadow-lg hover:shadow-primary/25 sm:inline-flex"
          >
            <svg
              className="mr-1.5 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
              />
            </svg>
            开始生成
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-black/5 hover:text-ink md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 9h16.5m-16.5 6.75h16.5"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/60 bg-white/95 px-6 py-4 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-ink-muted hover:bg-black/5 hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              to="/create"
              onClick={() => setMobileOpen(false)}
              className="btn-shine mt-2 rounded-lg bg-gradient-to-r from-primary to-primary-light px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md"
            >
              开始生成
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
