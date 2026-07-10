import { useState, useEffect } from 'react'

/**
 * 通用防抖 Hook
 * 手写实现，不依赖 lodash，减少 bundle 体积
 *
 * @param value - 需要防抖的值
 * @param delay - 防抖延迟（毫秒），默认 500ms
 * @returns 防抖后的值，只有在指定时间内没有新值更新时才会变化
 *
 * @example
 * const [text, setText] = useState('')
 * const debouncedText = useDebounce(text, 500)
 * // debouncedText 只在用户停止输入 500ms 后才更新
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // 清理上一次定时器，防止内存泄漏
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
