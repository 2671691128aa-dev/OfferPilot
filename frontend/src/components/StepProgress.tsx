interface StepProgressProps {
  currentStep: number
  steps: string[]
}

export default function StepProgress({ currentStep, steps }: StepProgressProps) {
  return (
    <div className="relative flex flex-col gap-0">
      {steps.map((label, index) => {
        const stepNum = index + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={label} className="relative flex items-start gap-3">
            {/* 左侧：圆点 + 连接线 */}
            <div className="relative flex flex-col items-center">
              {/* 圆点 */}
              <div
                className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/10'
                    : isCompleted
                      ? 'bg-primary/15 text-primary'
                      : 'bg-border text-ink-muted'
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              {/* 连接线 */}
              {!isLast && (
                <div
                  className={`w-0.5 transition-all duration-500 ${
                    isCompleted ? 'h-8 bg-primary/30' : 'h-8 bg-border'
                  }`}
                />
              )}
            </div>

            {/* 右侧：标签 */}
            <div className={`pt-2 ${isLast ? '' : 'pb-8'}`}>
              <span
                className={`text-sm transition-all duration-300 ${
                  isActive
                    ? 'font-semibold text-ink'
                    : isCompleted
                      ? 'font-medium text-primary/70'
                      : 'text-ink-muted/60'
                }`}
              >
                {label}
              </span>
              {isActive && <p className="mt-0.5 text-[11px] text-ink-muted">当前步骤</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
