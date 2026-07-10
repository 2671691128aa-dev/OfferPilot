### Task 2: Animation Components — `CountUpNumber`, `TypeWriterText`, `PopInTag`

**Files:**
- Create: `frontend/src/components/CountUpNumber.tsx`
- Create: `frontend/src/components/TypeWriterText.tsx`
- Create: `frontend/src/components/PopInTag.tsx`

**Interfaces:**
- Consumes: simple props (value, text, items)
- Produces: animated visual components used by page tasks

- [ ] **Step 1: Create `CountUpNumber.tsx`**

```tsx
// frontend/src/components/CountUpNumber.tsx
import { useState, useEffect, useRef } from 'react'

interface CountUpNumberProps {
  value: number
  duration?: number
  className?: string
}

export default function CountUpNumber({
  value,
  duration = 600,
  className = '',
}: CountUpNumberProps) {
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = prevValue.current
    const diff = value - start
    if (diff === 0) return

    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setDisplay(Math.round(start + diff * eased))

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevValue.current = value
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return <span className={className}>{display}</span>
}
```

- [ ] **Step 2: Create `TypeWriterText.tsx`**

```tsx
// frontend/src/components/TypeWriterText.tsx
import { useState, useEffect, useRef } from 'react'

interface TypeWriterTextProps {
  text: string
  speed?: number
  className?: string
  onComplete?: () => void
}

export default function TypeWriterText({
  text,
  speed = 20,
  className = '',
  onComplete,
}: TypeWriterTextProps) {
  const [charCount, setCharCount] = useState(0)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const completedRef = useRef(false)

  useEffect(() => {
    setCharCount(0)
    completedRef.current = false
  }, [text])

  useEffect(() => {
    if (charCount >= text.length) {
      if (!completedRef.current) {
        completedRef.current = true
        onComplete?.()
      }
      return
    }

    // Dynamic chars per frame: longer text → more chars per frame
    const charsPerFrame = Math.max(1, Math.ceil(text.length / 200))
    const frameInterval = speed / charsPerFrame

    const animate = (now: number) => {
      if (now - lastTimeRef.current >= frameInterval) {
        lastTimeRef.current = now
        setCharCount((prev) => Math.min(prev + charsPerFrame, text.length))
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [text, charCount, speed, onComplete])

  const showCursor = charCount < text.length

  return (
    <span className={className}>
      {text.slice(0, charCount)}
      {showCursor && (
        <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-primary align-middle" />
      )}
    </span>
  )
}
```

- [ ] **Step 3: Create `PopInTag.tsx`**

```tsx
// frontend/src/components/PopInTag.tsx
import { useRef, useEffect, useState } from 'react'

interface PopInTagProps {
  items: string[]
  className?: string
  stagger?: number
  renderItem?: (item: string, isNew: boolean) => React.ReactNode
}

export default function PopInTag({
  items,
  className = '',
  stagger = 50,
  renderItem,
}: PopInTagProps) {
  const [visibleCount, setVisibleCount] = useState(items.length)
  const prevLengthRef = useRef(items.length)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    // Clear previous timers
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    const prevLen = prevLengthRef.current
    const newLen = items.length

    if (newLen > prevLen) {
      // New items added — reveal them with stagger
      setVisibleCount(prevLen)
      const totalNew = newLen - prevLen
      // Clamp stagger so total doesn't exceed 800ms
      const actualStagger = Math.min(stagger, Math.floor(800 / totalNew))

      for (let i = 0; i < totalNew; i++) {
        const timer = setTimeout(() => {
          setVisibleCount(prevLen + i + 1)
        }, actualStagger * (i + 1))
        timersRef.current.push(timer)
      }
    } else {
      setVisibleCount(newLen)
    }

    prevLengthRef.current = newLen

    return () => {
      timersRef.current.forEach(clearTimeout)
    }
  }, [items.length, stagger])

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item, i) => {
        const isNew = i >= visibleCount - (items.length - visibleCount) && i < visibleCount
        const isVisible = i < visibleCount

        if (renderItem) {
          return (
            <div
              key={item + i}
              className={`transition-all duration-200 ease-out ${
                isVisible
                  ? 'scale-100 opacity-100'
                  : 'scale-80 opacity-0'
              }`}
              style={{ transitionDelay: isNew ? `${(i % 5) * 50}ms` : '0ms' }}
            >
              {renderItem(item, i >= items.length - (items.length - visibleCount))}
            </div>
          )
        }

        return (
          <span
            key={item + i}
            className={`inline-flex items-center rounded-full bg-surface-warm px-3 py-1.5 text-sm text-ink-light transition-all duration-200 ease-out ${
              isVisible
                ? 'scale-100 opacity-100'
                : 'scale-80 opacity-0'
            }`}
            style={{ transitionDelay: `${(i % 8) * stagger}ms` }}
          >
            {item}
          </span>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/CountUpNumber.tsx frontend/src/components/TypeWriterText.tsx frontend/src/components/PopInTag.tsx
git commit -m "feat: add animation components (CountUpNumber, TypeWriterText, PopInTag)"
```

---

