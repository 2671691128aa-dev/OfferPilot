import { Link } from 'react-router-dom'

const features = [
  {
    title: 'AI 简历生成',
    description: '输入你的经历，AI 自动生成匹配岗位的专业简历。',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
        />
      </svg>
    ),
    accent: 'from-primary to-primary-light',
  },
  {
    title: '智能优化',
    description: 'AI 分析你的简历，给出评分、问题诊断和修改建议。',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
        />
      </svg>
    ),
    accent: 'from-accent to-accent-light',
  },
  {
    title: '岗位匹配',
    description: '粘贴 JD，AI 分析岗位要求，评估你的匹配度和差距。',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
        />
      </svg>
    ),
    accent: 'from-emerald-500 to-teal-400',
  },
]

const steps = [
  { number: '01', title: '填写经历', description: '输入你的个人信息、技能和项目经验' },
  { number: '02', title: 'AI 分析', description: 'AI 理解你的技能，匹配岗位关键词' },
  { number: '03', title: '生成简历', description: '获得专业排版的岗位匹配简历' },
  { number: '04', title: '导出使用', description: '下载 PDF，直接投递简历' },
]

export default function Home() {
  return (
    <div>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:pb-28 sm:pt-24">
        {/* Floating orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-xs font-medium text-ink-muted">AI 驱动 · 免费使用</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
            你的第一份专业简历
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              只需 5 分钟
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted sm:text-xl">
            告诉 AI 你的经历，它会帮你优化项目描述、匹配岗位需求， 生成一份让 HR
            眼前一亮的实习简历。
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/create"
              className="btn-shine inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark hover:shadow-primary/40"
            >
              立即生成简历
              <svg
                className="h-4 w-4"
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
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-4 text-sm font-semibold text-ink transition hover:bg-surface-warm"
            >
              了解更多
            </a>
          </div>

          {/* Trust signal */}
          <p className="mt-8 text-xs text-ink-muted">无需注册 · 数据安全存储在本地 · 随时可清除</p>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">核心功能</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              从经历到简历，AI 全程助力
            </h2>
            <p className="mt-4 text-ink-muted">三大 AI 功能覆盖简历制作全流程</p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="feature-accent card-lift rounded-xl border border-border bg-card p-7 pl-8"
              >
                <div
                  className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white`}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Steps ─── */}
      <section className="bg-surface-warm px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">使用流程</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              四步搞定简历
            </h2>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`relative text-center ${
                  index < steps.length - 1 ? 'timeline-connector' : ''
                }`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-lg font-extrabold text-white shadow-lg shadow-primary/20">
                  {step.number}
                </div>
                <h3 className="mt-5 text-base font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden px-6 py-24">
        <div
          className="orb orb-1"
          style={{
            opacity: 0.15,
            width: 400,
            height: 400,
            top: 'auto',
            bottom: -100,
            right: '10%',
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            准备好拿到你的第一个 Offer 了吗？
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted">
            只需 5 分钟，让 AI 帮你把经历变成一份专业的实习简历。
          </p>
          <Link
            to="/create"
            className="btn-shine mt-10 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark"
          >
            立即开始
            <svg
              className="h-4 w-4"
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
      </section>
    </div>
  )
}
