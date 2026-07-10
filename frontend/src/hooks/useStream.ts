import { useState, useRef, useCallback } from 'react'

export type StreamStatus = 'idle' | 'streaming' | 'done' | 'error'

export interface UseStreamResult<T> {
  status: StreamStatus
  data: T | null
  rawText: string
  errorMsg: string
  start: (body: unknown) => void
  abort: () => void
  reset: () => void
}

/**
 * Custom hook for consuming SSE streams from the backend.
 * Accumulates raw AI text in real-time and parses the final JSON on completion.
 */
export function useStream<T>(url: string): UseStreamResult<T> {
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [data, setData] = useState<T | null>(null)
  const [rawText, setRawText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setStatus('idle')
    setData(null)
    setRawText('')
    setErrorMsg('')
  }, [])

  const start = useCallback(
    (body: unknown) => {
      // Abort any previous request
      if (abortRef.current) {
        abortRef.current.abort()
      }

      const controller = new AbortController()
      abortRef.current = controller

      setStatus('streaming')
      setData(null)
      setRawText('')
      setErrorMsg('')

      const fetchStream = async () => {
        let res: Response
        try {
          res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
          })
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          setStatus('error')
          setErrorMsg('网络连接失败，请检查网络后重试')
          return
        }

        if (!res.ok || !res.body) {
          // Fallback: try to read as JSON error
          try {
            const json = await res.json()
            setStatus('error')
            setErrorMsg((json.message as string) || `服务器错误 (HTTP ${res.status})`)
          } catch {
            setStatus('error')
            setErrorMsg(`服务器返回了无效响应 (HTTP ${res.status})`)
          }
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // Parse SSE lines
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // keep incomplete line in buffer

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const jsonStr = line.slice(6)

              try {
                const event = JSON.parse(jsonStr)

                if (event.type === 'chunk') {
                  accumulated += event.content
                  setRawText(accumulated)
                } else if (event.type === 'done') {
                  setData(event.data as T)
                  setStatus('done')
                  return
                } else if (event.type === 'error') {
                  setErrorMsg(event.message || 'AI 生成失败')
                  setStatus('error')
                  return
                }
              } catch {
                // skip malformed SSE events
              }
            }
          }

          // If we reach here without a 'done' event, try to parse accumulated text
          if (accumulated.trim()) {
            try {
              const parsed = JSON.parse(accumulated.trim())
              setData(parsed as T)
              setStatus('done')
            } catch {
              setStatus('error')
              setErrorMsg('AI 返回的 JSON 格式无效')
            }
          }
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          setStatus('error')
          setErrorMsg('读取流数据时出错')
        }
      }

      fetchStream()
    },
    [url],
  )

  return { status, data, rawText, errorMsg, start, abort, reset }
}
