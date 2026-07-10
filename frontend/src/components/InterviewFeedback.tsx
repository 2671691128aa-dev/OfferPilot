import type { InterviewFeedback } from '../services/api'
import type { StreamStatus } from '../hooks/useStream'
import { useProgressiveJSON } from '../hooks/useProgressiveJSON'
import CountUpNumber from './CountUpNumber'

interface InterviewFeedbackCardProps {
  feedback: InterviewFeedback
  isStreaming: boolean
  rawText: string
}

export default function InterviewFeedbackCard({
  feedback,
  isStreaming,
  rawText,
}: InterviewFeedbackCardProps) {
  if (isStreaming) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-3 w-3">
            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </div>
          <span className="text-sm font-medium text-ink">AI 正在评估你的回答...</span>
        </div>
        <div className="max-h-40 overflow-y-auto rounded-lg bg-ink/[0.03] p-3 font-mono text-xs leading-relaxed text-ink-muted whitespace-pre-wrap">
          {rawText || '连接中...'}
          <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-primary" />
        </div>
      </div>
    )
  }

  const scoreColor =
    feedback.score >= 80
      ? 'bg-success/10 text-success'
      : feedback.score >= 60
        ? 'bg-accent/10 text-accent'
        : 'bg-error/10 text-error'

  const scoreLabel =
    feedback.score >= 90
      ? '优秀'
      : feedback.score >= 75
        ? '良好'
        : feedback.score >= 60
          ? '一般'
          : '待改进'

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      {/* Score */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-extrabold ${scoreColor}`}
        >
          {feedback.score}
        </div>
        <div>
          <p className="text-base font-bold text-ink">{scoreLabel}</p>
          <p className="text-xs text-ink-muted">回答评分</p>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid gap-4 sm:grid-cols-2">
        {feedback.strengths.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-medium text-success">✓ 优势</h4>
            <ul className="space-y-1">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex gap-1.5 text-sm text-ink-light">
                  <span className="mt-0.5 shrink-0 text-success">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {feedback.weaknesses.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-medium text-error">✗ 不足</h4>
            <ul className="space-y-1">
              {feedback.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-1.5 text-sm text-ink-light">
                  <span className="mt-0.5 shrink-0 text-error">•</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Suggested improvement */}
      {feedback.suggestedImprovement && (
        <div className="rounded-lg border border-primary/15 bg-primary/[0.03] p-3">
          <h4 className="mb-1 text-xs font-medium text-primary">改进建议</h4>
          <p className="text-sm text-ink-light">{feedback.suggestedImprovement}</p>
        </div>
      )}

      {/* Strong example */}
      {feedback.strongExample && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-primary hover:text-primary-dark">
            查看优秀回答示例
          </summary>
          <div className="mt-2 rounded-lg border border-success/15 bg-success/[0.03] p-3">
            <p className="text-sm leading-relaxed text-ink-light">{feedback.strongExample}</p>
          </div>
        </details>
      )}
    </div>
  )
}

// ─── Streaming variant ───

interface InterviewFeedbackStreamingProps {
  rawText: string
  streamStatus: StreamStatus
}

export function InterviewFeedbackStreaming({
  rawText,
  streamStatus,
}: InterviewFeedbackStreamingProps) {
  const progressive = useProgressiveJSON<{
    score: number
    strengths: string[]
    weaknesses: string[]
    suggestedImprovement: string
    strongExample: string
  }>(
    rawText,
    {
      score: 'number',
      strengths: 'array',
      weaknesses: 'array',
      suggestedImprovement: 'string',
      strongExample: 'string',
    },
    streamStatus,
  )

  const score = progressive.fields.score?.value
  const scoreColor =
    score != null
      ? score >= 80
        ? 'bg-success/10 text-success'
        : score >= 60
          ? 'bg-accent/10 text-accent'
          : 'bg-error/10 text-error'
      : 'bg-border/40 text-ink-muted'

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      {/* Score */}
      {score != null && (
        <div className="animate-fade-up flex items-center gap-3">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-extrabold ${scoreColor}`}
          >
            <CountUpNumber value={score} />
          </div>
          <div>
            <p className="text-base font-bold text-ink">
              {score >= 90 ? '优秀' : score >= 75 ? '良好' : score >= 60 ? '一般' : '待改进'}
            </p>
            <p className="text-xs text-ink-muted">回答评分</p>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid gap-4 sm:grid-cols-2">
        {progressive.fields.strengths?.value && progressive.fields.strengths.value.length > 0 && (
          <div className="animate-fade-up">
            <h4 className="mb-2 text-xs font-medium text-success">✓ 优势</h4>
            <ul className="space-y-1">
              {progressive.fields.strengths.value.map((s, i) => (
                <li
                  key={i}
                  className="animate-fade-up flex gap-1.5 text-sm text-ink-light"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="mt-0.5 shrink-0 text-success">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {progressive.fields.weaknesses?.value && progressive.fields.weaknesses.value.length > 0 && (
          <div className="animate-fade-up">
            <h4 className="mb-2 text-xs font-medium text-error">✗ 不足</h4>
            <ul className="space-y-1">
              {progressive.fields.weaknesses.value.map((w, i) => (
                <li
                  key={i}
                  className="animate-fade-up flex gap-1.5 text-sm text-ink-light"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="mt-0.5 shrink-0 text-error">•</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Suggested improvement */}
      {progressive.fields.suggestedImprovement?.value && (
        <div className="animate-fade-up rounded-lg border border-primary/15 bg-primary/[0.03] p-3">
          <h4 className="mb-1 text-xs font-medium text-primary">改进建议</h4>
          <p className="text-sm text-ink-light">{progressive.fields.suggestedImprovement.value}</p>
        </div>
      )}

      {/* Skeleton */}
      {score == null && (
        <div className="flex animate-pulse items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-border/40" />
          <div className="space-y-1.5">
            <div className="h-3 w-16 rounded bg-border/40" />
            <div className="h-2 w-24 rounded bg-border/30" />
          </div>
        </div>
      )}
    </div>
  )
}
