import { Link } from 'react-router-dom'

/**
 * 全局页脚组件
 * 包含品牌信息、功能导航、社交链接、版权信息
 */
export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-gradient-to-b from-surface to-surface-warm/50">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
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
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              AI 驱动的求职助手，帮助大学生打造专业实习简历。
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                运行中
              </span>
              <span className="text-xs text-ink-muted/60">v2.0</span>
            </div>
          </div>

          {/* 功能导航 */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">功能</h4>
            <div className="mt-4 flex flex-col gap-2.5">
              {[
                { to: '/create', label: 'AI 简历生成' },
                { to: '/optimize', label: '简历优化' },
                { to: '/analyze', label: '岗位分析' },
                { to: '/interview', label: '模拟面试' },
                { to: '/export', label: 'PDF 导出' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-primary"
                >
                  <svg
                    className="h-3 w-3 text-ink-muted/40"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 关于 */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">关于</h4>
            <div className="mt-4 flex flex-col gap-2.5 text-sm text-ink-muted">
              <span>React 19 + TypeScript</span>
              <span>Tailwind CSS v4</span>
              <span>DeepSeek AI</span>
              <span>Express + Node.js</span>
            </div>
          </div>

          {/* 快速开始 */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">快速开始</h4>
            <p className="mt-4 text-sm text-ink-muted">填写个人信息，AI 自动生成专业简历。</p>
            <Link
              to="/create"
              className="btn-shine mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark"
            >
              立即创建简历
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* 分割线 + 版权 */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 sm:flex-row">
          <p className="text-xs text-ink-muted">© 2026 OfferPilot. Built with AI for students.</p>
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-primary"
            >
              GitHub
            </a>
            <a
              href="https://react.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-primary"
            >
              React
            </a>
            <a
              href="https://tailwindcss.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-primary"
            >
              Tailwind
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
