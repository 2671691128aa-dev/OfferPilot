import { useState } from 'react'
import { Link } from 'react-router-dom'
import { loadResumeData, type ResumeFormData } from '../utils/storage'
import { STREAM_ENDPOINTS, type OptimizeResult } from '../services/api'
import { useStream } from '../hooks/useStream'
import ErrorState from '../components/ErrorState'
import { useProgressiveJSON } from '../hooks/useProgressiveJSON'
import StreamProgress from '../components/StreamProgress'
import StreamCancel from '../components/StreamCancel'
import CountUpNumber from '../components/CountUpNumber'

function buildResumeText(data: ResumeFormData): string {
  const lines: string[] = []
  const { profile, education, skills, projects, targetRole } = data

  lines.push(profile.name)
  if (profile.email) lines.push(`邮箱：${profile.email}`)
  if (profile.location) lines.push(`所在城市：${profile.location}`)
  if (targetRole) lines.push(`目标岗位：${targetRole}`)

  if (education?.school || education?.degree) {
    lines.push('')
    const eduParts = [education.degree, education.school, education.major].filter(Boolean)
    lines.push(`教育经历：${eduParts.join(' · ')}`)
    if (education.startDate || education.endDate) {
      lines.push(`  时间：${education.startDate || '?'} ~ ${education.endDate || '?'}`)
    }
  }

  if (skills.length > 0) {
    lines.push('')
    lines.push(`技能：${skills.join('、')}`)
  }

  if (projects.length > 0) {
    lines.push('')
    lines.push('项目经历：')
    for (const p of projects) {
      lines.push(`- ${p.name}`)
      if (p.technology) lines.push(`  技术栈：${p.technology}`)
      if (p.description) lines.push(`  描述：${p.description}`)
      if (p.role) lines.push(`  职责：${p.role}`)
    }
  }

  return lines.join('\n')
}

type ViewMode = 'input' | 'streaming' | 'error' | 'result'

export default function Optimize() {
  const storedData = loadResumeData()
  const hasStoredData = storedData.profile.name.trim() !== ''
  const generatedText = hasStoredData ? buildResumeText(storedData) : ''

  const [resumeText, setResumeText] = useState(generatedText)
  const [viewMode, setViewMode] = useState<ViewMode>('input')

  const {
    status,
    data: result,
    rawText,
    errorMsg,
    start,
    abort,
  } = useStream<OptimizeResult>(STREAM_ENDPOINTS.resumeOptimize)

  const progressive = useProgressiveJSON<OptimizeResult>(
    rawText,
    {
      score: 'number',
      advantages: 'array',
      problems: 'array',
      suggestions: 'array',
    },
    status,
  )

  const streamSteps = [
    { key: 'score', label: '评分' },
    { key: 'advantages', label: '优势' },
    { key: 'problems', label: '问题' },
    { key: 'suggestions', label: '建议' },
  ]

  // Map stream status to view mode
  const currentView: ViewMode =
    status === 'streaming'
      ? 'streaming'
      : status === 'error'
        ? 'error'
        : status === 'done'
          ? 'result'
          : viewMode

  const handleAnalyze = () => {
    if (!resumeText.trim()) return
    setViewMode('input')
    start({ resumeText, targetRole: storedData.targetRole || undefined })
  }

  const handleReset = () => {
    setViewMode('input')
  }

  const handleLoadStored = () => {
    setResumeText(generatedText)
  }

  const scoreLabel = (score: number) =>
    score >= 90 ? '优秀' : score >= 75 ? '良好' : score >= 60 ? '一般' : '待改进'

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* 页眉 */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">简历优化</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">AI 简历优化</h1>
        <p className="mt-2 text-ink-muted">
          粘贴你的简历内容，AI 将从内容质量、技术关键词、项目表达、岗位匹配度四个维度进行分析。
        </p>
      </div>

      {currentView === 'input' && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-border/20 sm:p-8">
          {hasStoredData && resumeText === '' && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/[0.03] px-5 py-3.5">
              <p className="text-sm text-primary/80">检测到已保存的简历数据，可以直接使用。</p>
              <button
                onClick={handleLoadStored}
                className="btn-shine rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-dark"
              >
                使用已保存的简历
              </button>
            </div>
          )}

          <label className="block text-sm font-semibold text-ink">简历内容</label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={16}
            placeholder="粘贴你的简历内容到这里..."
            className="mt-2 w-full rounded-xl border border-border bg-surface-warm/30 px-4 py-3 text-sm text-ink placeholder:text-ink-muted/40 transition-all duration-200 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/15 focus:outline-none"
          />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              {resumeText.length > 0 ? `已输入 ${resumeText.length} 字` : '请输入简历内容'}
            </p>
            <button
              onClick={handleAnalyze}
              disabled={!resumeText.trim()}
              className="btn-shine inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
            >
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
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                />
              </svg>
              AI 分析
            </button>
          </div>
        </div>
      )}

      {currentView === 'streaming' && (
        <div className="mt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">AI 正在分析...</h2>
            <StreamCancel onCancel={abort} />
          </div>

          <StreamProgress
            steps={streamSteps}
            completedKeys={progressive.completedKeys as string[]}
            currentKey={progressive.currentKey}
            progress={progressive.progress}
          />

          <div className="space-y-6">
            {/* Score — progressive */}
            {progressive.fields.score?.value != null && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-3xl font-extrabold text-white shadow-lg shadow-primary/20">
                    <CountUpNumber value={progressive.fields.score.value} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-ink">
                      {scoreLabel(progressive.fields.score.value)}
                    </p>
                    <p className="text-sm text-ink-muted">
                      你的简历基础不错，以下建议可以进一步提升。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Advantages — progressive */}
            {progressive.fields.advantages?.value &&
              progressive.fields.advantages.value.length > 0 && (
                <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    你的优势
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {progressive.fields.advantages.value.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ink-light">
                        <span className="mt-0.5 text-success">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Problems — progressive */}
            {progressive.fields.problems?.value && progressive.fields.problems.value.length > 0 && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  发现问题
                </h3>
                <ul className="mt-4 space-y-3">
                  {progressive.fields.problems.value.map((problem, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-xl bg-warning/8 p-3">
                      <span className="mt-0.5 text-warning">●</span>
                      <p className="text-sm text-ink-light">{problem}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions — progressive */}
            {progressive.fields.suggestions?.value &&
              progressive.fields.suggestions.value.length > 0 && (
                <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    优化建议
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {progressive.fields.suggestions.value.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-xl bg-success/8 p-3">
                        <span className="mt-0.5 text-success">✓</span>
                        <p className="text-sm text-ink-light">{suggestion}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      )}

      {currentView === 'error' && <ErrorState message={errorMsg} onRetry={handleAnalyze} />}

      {currentView === 'result' && result && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">分析结果</h2>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-card hover:text-ink"
            >
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
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                />
              </svg>
              重新分析
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-3xl font-extrabold text-white shadow-lg shadow-primary/20">
                {result.score}
              </div>
              <div>
                <p className="text-xl font-bold text-ink">{scoreLabel(result.score)}</p>
                <p className="text-sm text-ink-muted">你的简历基础不错，以下建议可以进一步提升。</p>
              </div>
            </div>
          </div>

          {result.advantages.length > 0 && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                你的优势
              </h3>
              <ul className="mt-4 space-y-2">
                {result.advantages.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-light">
                    <span className="mt-0.5 text-success">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.problems.length > 0 && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                发现问题
              </h3>
              <ul className="mt-4 space-y-3">
                {result.problems.map((problem, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl bg-warning/8 p-3">
                    <span className="mt-0.5 text-warning">●</span>
                    <p className="text-sm text-ink-light">{problem}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                优化建议
              </h3>
              <ul className="mt-4 space-y-3">
                {result.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl bg-success/8 p-3">
                    <span className="mt-0.5 text-success">✓</span>
                    <p className="text-sm text-ink-light">{suggestion}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Link
              to="/create"
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-card"
            >
              修改简历信息
            </Link>
            <Link
              to="/resume"
              className="btn-shine rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              查看简历预览
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
