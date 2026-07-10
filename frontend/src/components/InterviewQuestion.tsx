interface InterviewQuestionProps {
  question: {
    id: number
    category: string
    question: string
    context: string
  }
  questionNumber: number
  totalQuestions: number
  answer: string
  onAnswerChange: (value: string) => void
  onSubmit: () => void
  isSubmitting: boolean
}

const categoryConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
  技术: { color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', icon: '💻' },
  项目: { color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: '📁' },
  行为: { color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', icon: '🤝' },
}

export default function InterviewQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onAnswerChange,
  onSubmit,
  isSubmitting,
}: InterviewQuestionProps) {
  const config = categoryConfig[question.category] || {
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: '❓',
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-muted">
          第 {questionNumber} / {totalQuestions} 题
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.bgColor} ${config.color}`}
        >
          {config.icon} {question.category}题
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-1 text-xs font-medium text-ink-muted">{config.icon} 面试题目</div>
        <p className="text-lg font-semibold leading-relaxed text-ink">{question.question}</p>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-primary hover:text-primary-dark">
            查看考察点
          </summary>
          <p className="mt-1.5 text-sm text-ink-muted">{question.context}</p>
        </details>
      </div>

      {/* Answer input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">你的回答</label>
        <textarea
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="请尽可能详细地回答，包括你的思考过程、实际经验和具体案例..."
          rows={8}
          className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-muted/40 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
        />
        <div className="mt-1 text-xs text-ink-muted/50">{answer.length} 字</div>
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={isSubmitting || !answer.trim()}
        className="btn-shine w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-50 disabled:shadow-none"
      >
        {isSubmitting ? 'AI 正在评估...' : '提交答案'}
      </button>
    </div>
  )
}
