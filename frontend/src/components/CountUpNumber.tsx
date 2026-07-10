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
