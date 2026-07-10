import { Link } from 'react-router-dom'

const features = [
  {
    title: 'AI 简历生成',
    description: '输入你的经历，AI 自动生成匹配岗位的专业简历，流式渐进展示，零白屏等待。',
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
    stats: '5 分钟生成',
  },
  {
    title: '智能优化',
    description: 'AI 多维度分析简历，给出评分、问题诊断和修改建议，帮你发现隐藏的问题。',
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
    stats: '4 维度评分',
  },
  {
    title: '岗位匹配',
    description: '粘贴 JD，AI 提取岗位要求，评估你的匹配度和能力差距，精准定位提升方向。',
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
    accent: 'from-success to-teal-400',
    stats: '精准匹配',
  },
]

const steps = [
  {
    number: '01',
    title: '填写经历',
    description: '分 5 步输入个人信息、技能和项目经验，草稿自动保存',
  },
  {
    number: '02',
    title: 'AI 分析',
    description: 'AI 理解你的技能，匹配岗位关键词，渐进式展示结果',
  },
  { number: '03', title: '生成简历', description: '获得专业排版的岗位匹配简历，可直接在线编辑' },
  { number: '04', title: '导出使用', description: '下载 PDF，直接投递简历，支持多模板切换' },
]

const highlights = [
  { value: '6', label: '核心功能', description: '覆盖求职全流程' },
  { value: '14', label: 'API 接口', description: 'REST + SSE 流式' },
  { value: '53', label: '源文件', description: 'TypeScript 全覆盖' },
  { value: '8k+', label: '代码行数', description: '精心架构设计' },
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
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-xs font-medium text-ink-muted">
              AI 驱动 · 免费使用 · 数据本地存储
            </span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
            你的第一份专业简历
            <br />
            <span className="bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
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
              className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:shadow-primary/40"
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
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-8 py-4 text-sm font-semibold text-ink backdrop-blur-sm transition hover:bg-card"
            >
              了解更多
            </a>
          </div>

          {/* Trust signal */}
          <p className="mt-8 text-xs text-ink-muted">无需注册 · 数据安全存储在本地 · 随时可清除</p>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="border-y border-border/60 bg-card/50 px-6 py-12 backdrop-blur-sm">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
          {highlights.map((h) => (
            <div key={h.label} className="text-center">
              <div className="text-3xl font-extrabold text-primary">{h.value}</div>
              <div className="mt-1 text-sm font-semibold text-ink">{h.label}</div>
              <div className="mt-0.5 text-xs text-ink-muted">{h.description}</div>
            </div>
          ))}
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
                className="feature-accent card-hover-lift group rounded-2xl border border-border bg-card p-7 pl-8"
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white shadow-lg shadow-primary/10 transition-transform duration-200 group-hover:scale-110`}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.description}</p>
                <div className="mt-4 inline-flex rounded-full bg-primary/[0.06] px-3 py-1 text-xs font-medium text-primary">
                  {f.stats}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Steps ─── */}
      <section className="bg-surface-warm/60 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">使用流程</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              四步搞定简历
            </h2>
            <p className="mt-4 text-ink-muted">简单几步，从空白到专业简历</p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`relative text-center ${
                  index < steps.length - 1 ? 'timeline-connector' : ''
                }`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-lg font-extrabold text-white shadow-lg shadow-primary/20 transition-transform duration-200 hover:scale-110">
                  {step.number}
                </div>
                <h3 className="mt-5 text-base font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tech Stack ─── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">技术栈</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              现代技术，精心打造
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { name: 'React 19', desc: '前端框架' },
              { name: 'TypeScript', desc: '类型安全' },
              { name: 'Tailwind v4', desc: '样式系统' },
              { name: 'Express', desc: '后端框架' },
              { name: 'DeepSeek', desc: 'AI 大模型' },
              { name: 'Vite', desc: '构建工具' },
              { name: 'Zod', desc: '数据校验' },
              { name: 'react-hook-form', desc: '表单管理' },
              { name: 'SSE', desc: '流式传输' },
              { name: 'Vercel', desc: '前端部署' },
            ].map((tech) => (
              <div
                key={tech.name}
                className="card-hover-lift rounded-xl border border-border bg-card p-4 text-center"
              >
                <div className="text-sm font-bold text-ink">{tech.name}</div>
                <div className="mt-0.5 text-xs text-ink-muted">{tech.desc}</div>
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
            className="btn-shine mt-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:shadow-primary/40"
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
