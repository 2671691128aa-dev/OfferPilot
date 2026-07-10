import { useMemo } from 'react'
import type { StreamStatus } from './useStream'

export type FieldType = 'string' | 'number' | 'array' | 'object'

export interface ProgressiveField<T, K extends keyof T> {
  value: T[K] | null
  isComplete: boolean
  isStreaming: boolean
}

export interface UseProgressiveJSONResult<T> {
  fields: { [K in keyof T]: ProgressiveField<T, K> }
  completedKeys: (keyof T)[]
  currentKey: string | null
  progress: number
  isComplete: boolean
}

/**
 * Extracts completed top-level fields from a partial JSON string.
 * Returns a map of fieldName → parsed value for fields that are complete,
 * plus the position after the last successfully parsed key-value pair.
 */
function extractFields(
  rawText: string,
  schemaKeys: string[],
): { fields: Map<string, unknown>; lastParsedKeyEnd: number } {
  const result = new Map<string, unknown>()
  let lastParsedKeyEnd = -1
  if (!rawText || rawText.length < 3) return { fields: result, lastParsedKeyEnd }

  const rootStart = rawText.indexOf('{')
  if (rootStart === -1) return { fields: result, lastParsedKeyEnd }

  let pos = rootStart + 1

  const skipWs = (p: number): number => {
    while (p < rawText.length && /\s/.test(rawText[p])) p++
    return p
  }

  const skipString = (p: number): number => {
    if (rawText[p] !== '"') return p
    p++
    while (p < rawText.length) {
      if (rawText[p] === '\\') {
        p += 2
        continue
      }
      if (rawText[p] === '"') return p + 1
      p++
    }
    return p
  }

  const skipValue = (p: number): number => {
    p = skipWs(p)
    if (p >= rawText.length) return p

    const ch = rawText[p]

    if (ch === '"') return skipString(p)

    if (ch === '[' || ch === '{') {
      const open = ch
      const close = ch === '[' ? ']' : '}'
      let depth = 1
      p++
      while (p < rawText.length && depth > 0) {
        const c = rawText[p]
        if (c === '"') {
          p = skipString(p)
          continue
        }
        if (c === open) depth++
        else if (c === close) depth--
        if (depth > 0) p++
      }
      return depth === 0 ? p + 1 : rawText.length
    }

    while (p < rawText.length && !/[\s,\]}]/.test(rawText[p])) p++
    return p
  }

  while (pos < rawText.length) {
    pos = skipWs(pos)
    if (pos >= rawText.length || rawText[pos] === '}') break

    if (rawText[pos] !== '"') break
    const keyStart = pos + 1
    pos = skipString(pos)
    const key = rawText.slice(keyStart, pos - 1)

    pos = skipWs(pos)
    if (pos >= rawText.length || rawText[pos] !== ':') break
    pos++
    pos = skipWs(pos)

    const valueStart = pos
    pos = skipValue(pos)
    const valueEnd = pos

    // Value is complete if: we didn't hit end of text,
    // or the last char is a string close quote,
    // or the last char is a valid primitive terminator (digit, e for true/false, l for null)
    if (
      valueEnd < rawText.length ||
      rawText[valueEnd - 1] === '"' ||
      /[\detrul]/.test(rawText[valueEnd - 1])
    ) {
      if (schemaKeys.includes(key)) {
        const valueStr = rawText.slice(valueStart, valueEnd).trim()
        try {
          const parsed = JSON.parse(valueStr)
          result.set(key, parsed)
          lastParsedKeyEnd = pos
        } catch {
          // Incomplete or invalid — skip, will retry on next chunk
        }
      }
    }

    pos = skipWs(pos)
    if (pos < rawText.length && rawText[pos] === ',') pos++
  }

  return { fields: result, lastParsedKeyEnd }
}

/**
 * Check if a key appears in rawText after a given position.
 * Only searches after the last successfully parsed key to avoid
 * false positives from key names appearing inside value strings.
 */
function keyHasStarted(rawText: string, key: string, afterPos: number): boolean {
  const pattern = `"${key}"`
  return rawText.indexOf(pattern, Math.max(0, afterPos)) !== -1
}

export function useProgressiveJSON<T extends object>(
  rawText: string,
  schema: Record<string, FieldType>,
  streamStatus: StreamStatus,
): UseProgressiveJSONResult<T> {
  // Serialize schema keys so useMemo doesn't recompute when callers
  // pass a new object literal with the same keys each render
  const schemaKeyStr = Object.keys(schema).join(',')

  return useMemo(() => {
    const keys = schemaKeyStr.split(',') as (keyof T)[]
    const totalFields = keys.length

    // If stream is done, try to parse the complete JSON
    if (streamStatus === 'done' && rawText) {
      try {
        const fullParsed = JSON.parse(rawText) as T
        const fields = {} as { [K in keyof T]: ProgressiveField<T, K> }
        for (const key of keys) {
          fields[key] = {
            value: fullParsed[key] ?? null,
            isComplete: true,
            isStreaming: false,
          }
        }
        return {
          fields,
          completedKeys: keys,
          currentKey: null,
          progress: 100,
          isComplete: true,
        }
      } catch {
        // Fall through to incremental parsing
      }
    }

    // Incremental parsing
    const keyList = schemaKeyStr.split(',')
    const { fields: extracted, lastParsedKeyEnd } = extractFields(rawText, keyList)
    const completedKeys: (keyof T)[] = []
    const fields = {} as { [K in keyof T]: ProgressiveField<T, K> }
    let currentStreamingKey: string | null = null

    for (const key of keys) {
      const k = key as string
      if (extracted.has(k)) {
        fields[key] = {
          value: extracted.get(k) as T[typeof key],
          isComplete: true,
          isStreaming: false,
        }
        completedKeys.push(key)
      } else {
        // Only look for key after the last parsed position to avoid false positives
        const hasStarted = keyHasStarted(rawText, k, lastParsedKeyEnd)
        if (hasStarted && !currentStreamingKey) {
          currentStreamingKey = k
          fields[key] = {
            value: null,
            isComplete: false,
            isStreaming: true,
          }
        } else {
          fields[key] = {
            value: null,
            isComplete: false,
            isStreaming: false,
          }
        }
      }
    }

    const progress = totalFields > 0 ? Math.round((completedKeys.length / totalFields) * 100) : 0

    return {
      fields,
      completedKeys,
      currentKey: currentStreamingKey,
      progress,
      isComplete: completedKeys.length === totalFields,
    }
  }, [rawText, schemaKeyStr, streamStatus])
}
