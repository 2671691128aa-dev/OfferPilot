interface StepProgressProps {
  currentStep: number
  steps: string[]
}

export default function StepProgress({ currentStep, steps }: StepProgressProps) {
  return (
    <div className="flex flex-col gap-1">
      {steps.map((label, index) => {
        const stepNum = index + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep

        return (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
              isActive ? 'bg-primary/8' : 'opacity-60 hover:opacity-80'
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
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
            <span className={`text-sm ${isActive ? 'font-semibold text-ink' : 'text-ink-muted'}`}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
