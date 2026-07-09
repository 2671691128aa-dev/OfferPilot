import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { loadResumeData } from '../utils/storage'
import { STREAM_ENDPOINTS, type AnalyzeResult } from '../services/api'
import { useStream } from '../hooks/useStream'
import ErrorState from '../components/ErrorState'

function StreamingIndicator({ rawText }: { rawText: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [rawText])

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-3 w-3">
          <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
        </div>
        <span className="text-sm font-medium text-ink">AI 正在分析岗位要求...</span>
      </div>
      <div
        ref={ref}
        className="max-h-64 overflow-y-auto rounded-xl border border-border bg-ink/[0.03] p-5 font-mono text-xs leading-relaxed text-ink-muted whitespace-pre-wrap"
      >
        {rawText || '连接中...'}
        <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary" />
      </div>
    </div>
  )
}

type ViewMode = 'input' | 'streaming' | 'error' | 'result'

export default function Analyze() {
  const [jdText, setJdText] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('input')

  const data = loadResumeData()
  const hasProfile = data.profile.name.trim() !== ''

  const {
    status,
    data: result,
    rawText,
    errorMsg,
    start,
  } = useStream<AnalyzeResult>(STREAM_ENDPOINTS.jobAnalyze)

  const currentView: ViewMode =
    status === 'streaming'
      ? 'streaming'
      : status === 'error'
        ? 'error'
        : status === 'done'
          ? 'result'
          : viewMode

  const handleAnalyze = () => {
    if (!jdText.trim()) return
    setViewMode('input')
    start({ jd: jdText, userSkills: data.skills })
  }

  const handleReset = () => {
    setViewMode('input')
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">JD 岗位分析</h1>
      <p className="mt-2 text-sm text-ink-muted">
        粘贴企业招聘描述，AI 将分析岗位要求、评估匹配度，并指出你的能力差距。
      </p>

      {currentView === 'input' && (
        <div className="mt-8">
          <label className="block text-sm font-medium text-ink-light">岗位描述（JD）</label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={16}
            placeholder="粘贴招聘岗位要求到这里..."
            className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-muted/50 transition focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
          />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              {jdText.length > 0 ? `已输入 ${jdText.length} 字` : '请粘贴岗位描述'}
            </p>
            <button
              onClick={handleAnalyze}
              disabled={!jdText.trim()}
              className="btn-shine rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-30"
            >
              开始分析
            </button>
          </div>
          {!hasProfile && (
            <div className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-4">
              <p className="text-sm text-warning">
                <span className="font-medium">提示：</span>
                你还没有填写个人信息，匹配度分析将基于通用标准。
                <Link to="/create" className="ml-1 font-medium text-ink underline">
                  去填写信息 →
                </Link>
              </p>
            </div>
          )}
        </div>
      )}

      {currentView === 'streaming' && <StreamingIndicator rawText={rawText} />}

      {currentView === 'error' && <ErrorState message={errorMsg} onRetry={handleAnalyze} />}

      {currentView === 'result' && result && (
        <div className="mt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">分析结果</h2>
            <button
              onClick={handleReset}
              className="text-sm font-semibold text-primary transition hover:text-primary-dark"
            >
              ← 重新输入
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            {data.targetRole && (
              <p className="mb-3 text-sm text-ink-muted">
                目标岗位：<span className="font-medium text-ink">{data.targetRole}</span>
              </p>
            )}
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-3xl font-extrabold text-white shadow-lg shadow-primary/20">
                {result.matchScore}%
              </div>
              <div>
                <p className="text-xl font-bold text-ink">
                  匹配度：
                  {result.matchScore >= 80 ? '优秀' : result.matchScore >= 60 ? '良好' : '一般'}
                </p>
                <p className="text-sm text-ink-muted">
                  {result.matchScore >= 60
                    ? '你已具备岗位所需的大部分技能，补充以下内容可以进一步提升竞争力。'
                    : '你与岗位要求有一定差距，建议针对性补充技能。'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              岗位要求技能
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {result.requiredSkills.map((skill) => {
                const userHas = data.skills.some((s) => s.toLowerCase() === skill.toLowerCase())
                return (
                  <div
                    key={skill}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${userHas ? 'bg-success/8 text-success' : 'bg-surface-warm text-ink-muted'}`}
                  >
                    <span>{userHas ? '✓' : '○'}</span>
                    {skill}
                    {userHas && <span className="ml-auto text-xs text-success">已掌握</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {result.advantages.length > 0 && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                你的优势
              </h3>
              <ul className="mt-4 space-y-2">
                {result.advantages.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-light">
                    <span className="mt-0.5 text-success">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.gaps.length > 0 && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                能力差距
              </h3>
              <ul className="mt-4 space-y-2">
                {result.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-light">
                    <span className="mt-0.5 text-warning">!</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleReset}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-card"
            >
              分析另一个岗位
            </button>
            <Link
              to="/create"
              className="btn-shine rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              完善简历信息
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
