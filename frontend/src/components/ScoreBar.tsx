interface ScoreBarProps {
  label: string
  score: number
}

/**
 * 评分进度条组件
 *
 * 展示一个维度的评分百分比，带圆角进度条动画。
 */
export default function ScoreBar({ label, score }: ScoreBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-muted">{label}</span>
        <span className="font-medium text-ink">{score}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
