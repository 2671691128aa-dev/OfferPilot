import type { InterviewReport as ReportType, InterviewQuestion } from '../services/api'

interface InterviewReportProps {
  report: ReportType
  questions: InterviewQuestion[]
  onRetake: () => void
}

export default function InterviewReportCard({ report, questions, onRetake }: InterviewReportProps) {
  const scoreColor =
    report.overallScore >= 80
      ? 'from-success to-success/80'
      : report.overallScore >= 60
        ? 'from-primary to-primary-light'
        : 'from-error to-error/80'

  const scoreLabel =
    report.overallScore >= 90
      ? '优秀'
      : report.overallScore >= 75
        ? '良好'
        : report.overallScore >= 60
          ? '一般'
          : '待改进'

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${scoreColor} text-3xl font-extrabold text-white shadow-lg`}
        >
          {report.overallScore}
        </div>
        <h2 className="mt-4 text-xl font-bold text-ink">{scoreLabel}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{report.summary}</p>
      </div>

      {/* Per-question scores */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          各题得分
        </h3>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const qScore = report.questionScores.find((qs) => qs.questionId === q.id)?.score ?? 0
            const barColor = qScore >= 80 ? 'bg-success' : qScore >= 60 ? 'bg-primary' : 'bg-error'

            return (
              <div key={q.id}>
                <div className="mb-1 flex items-start justify-between gap-3">
                  <span className="text-sm text-ink-light line-clamp-1">
                    {i + 1}. {q.question}
                  </span>
                  <span className="shrink-0 text-sm font-medium text-ink">{qScore}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all duration-700`}
                    style={{ width: `${qScore}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid gap-6 sm:grid-cols-2">
        {report.topStrengths.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-success">
              核心优势
            </h3>
            <ul className="space-y-2">
              {report.topStrengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-light">
                  <span className="mt-0.5 shrink-0 text-success">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.keyImprovements.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-error">
              改进方向
            </h3>
            <ul className="space-y-2">
              {report.keyImprovements.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-light">
                  <span className="mt-0.5 shrink-0 text-error">→</span> {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Practice topics */}
      {report.practiceTopics.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            推荐练习话题
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.practiceTopics.map((topic, i) => (
              <span
                key={i}
                className="rounded-full bg-primary/8 px-3 py-1.5 text-sm font-medium text-primary"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onRetake}
          className="flex-1 rounded-xl border border-primary/30 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
        >
          重新面试
        </button>
        <a
          href="/resume"
          className="flex-1 rounded-xl bg-primary py-3 text-center text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          返回简历
        </a>
      </div>
    </div>
  )
}
