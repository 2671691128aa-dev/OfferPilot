import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-warm">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <svg
                  className="h-3.5 w-3.5 text-white"
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
              <span className="text-sm font-bold tracking-tight text-ink">OfferPilot</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              AI 驱动的求职助手，帮助大学生打造专业实习简历。
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">功能</h4>
            <div className="mt-3 flex flex-col gap-2">
              <Link to="/create" className="text-sm text-ink-muted transition hover:text-ink">
                AI 简历生成
              </Link>
              <Link to="/optimize" className="text-sm text-ink-muted transition hover:text-ink">
                简历优化
              </Link>
              <Link to="/analyze" className="text-sm text-ink-muted transition hover:text-ink">
                岗位分析
              </Link>
              <Link to="/export" className="text-sm text-ink-muted transition hover:text-ink">
                PDF 导出
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">资源</h4>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink-muted transition hover:text-ink"
              >
                GitHub
              </a>
              <a
                href="https://react.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink-muted transition hover:text-ink"
              >
                React
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-center text-xs text-ink-muted">
            © 2026 OfferPilot. Built with AI for students.
          </p>
        </div>
      </div>
    </footer>
  )
}
