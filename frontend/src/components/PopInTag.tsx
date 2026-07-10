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
        const timer = setTimeout(
          () => {
            setVisibleCount(prevLen + i + 1)
          },
          actualStagger * (i + 1),
        )
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
        const isVisible = i < visibleCount

        if (renderItem) {
          return (
            <div
              key={item + i}
              className={`transition-all duration-200 ease-out ${
                isVisible ? 'scale-100 opacity-100' : 'scale-80 opacity-0'
              }`}
            >
              {renderItem(item, isVisible)}
            </div>
          )
        }

        return (
          <span
            key={item + i}
            className={`inline-flex items-center rounded-full bg-surface-warm px-3 py-1.5 text-sm text-ink-light transition-all duration-200 ease-out ${
              isVisible ? 'scale-100 opacity-100' : 'scale-80 opacity-0'
            }`}
            style={{ transitionDelay: `${Math.min((i % 8) * stagger, 800)}ms` }}
          >
            {item}
          </span>
        )
      })}
    </div>
  )
}
