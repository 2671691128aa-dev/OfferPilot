### Task 3: `StreamProgress` and `StreamCancel` Components

**Files:**
- Create: `frontend/src/components/StreamProgress.tsx`
- Create: `frontend/src/components/StreamCancel.tsx`

**Interfaces:**
- Consumes: step definitions + completed/current keys
- Produces: reusable progress indicator + cancel button for all streaming pages

- [ ] **Step 1: Create `StreamProgress.tsx`**

```tsx
// frontend/src/components/StreamProgress.tsx
interface StreamProgressProps {
  steps: Array<{ key: string; label: string }>
  completedKeys: string[]
  currentKey: string | null
  progress: number
}

export default function StreamProgress({
  steps,
  completedKeys,
  currentKey,
  progress,
}: StreamProgressProps) {
  return (
    <div className="mb-6">
      {/* Steps row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6">
        {steps.map((step) => {
          const isComplete = completedKeys.includes(step.key)
          const isCurrent = currentKey === step.key

          return (
            <div key={step.key} className="flex items-center gap-1.5">
              {isComplete ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-[10px] text-white">
                  ✓
                </span>
              ) : isCurrent ? (
                <span className="relative flex h-5 w-5 items-center justify-center">
                  <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-primary/30" />
                  <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                    ●
                  </span>
                </span>
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-border text-[10px] text-ink-muted">
                  ○
                </span>
              )}
              <span
                className={`text-xs font-medium ${
                  isComplete
                    ? 'text-success'
                    : isCurrent
                      ? 'text-primary'
                      : 'text-ink-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `StreamCancel.tsx`**

```tsx
// frontend/src/components/StreamCancel.tsx
interface StreamCancelProps {
  onCancel: () => void
}

export default function StreamCancel({ onCancel }: StreamCancelProps) {
  return (
    <button
      onClick={onCancel}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-error/30 hover:text-error"
    >
      取消
    </button>
  )
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/StreamProgress.tsx frontend/src/components/StreamCancel.tsx
git commit -m "feat: add StreamProgress and StreamCancel components"
```

---

