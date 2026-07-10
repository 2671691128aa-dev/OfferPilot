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
