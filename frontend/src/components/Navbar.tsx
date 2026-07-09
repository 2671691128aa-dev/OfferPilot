import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/create', label: 'AI简历' },
  { path: '/optimize', label: '简历优化' },
  { path: '/analyze', label: '岗位分析' },
  { path: '/export', label: '导出' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastScroll = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY
      // Only hide after scrolling past the nav height, and on downward scroll
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

  // Reset hidden state on route change
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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
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
          <span className="text-lg font-bold tracking-tight text-ink">OfferPilot</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary/10 text-primary'
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
            className="btn-shine hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark sm:inline-block"
          >
            开始生成
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-black/5 md:hidden"
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
        <div className="border-t border-border-light bg-white/95 px-6 py-4 backdrop-blur-md md:hidden">
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
                      ? 'bg-primary/10 text-primary'
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
              className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              开始生成
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
