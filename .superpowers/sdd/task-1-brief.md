### Task 1: `useProgressiveJSON` Hook — Incremental JSON Parser

**Files:**
- Create: `frontend/src/hooks/useProgressiveJSON.ts`

**Interfaces:**
- Consumes: `rawText: string` from `useStream`, `schema: Record<string, FieldType>`, `streamStatus: StreamStatus`
- Produces: `useProgressiveJSON<T>(rawText, schema, status)` returning `{ fields, completedKeys, currentKey, progress, isComplete }`

- [ ] **Step 1: Create the hook file with types and signature**

```typescript
// frontend/src/hooks/useProgressiveJSON.ts
import { useState, useMemo } from 'react'
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

export function useProgressiveJSON<T extends Record<string, unknown>>(
  rawText: string,
  schema: Record<string, FieldType>,
  streamStatus: StreamStatus,
): UseProgressiveJSONResult<T> {
  // Implementation in Step 2
  return null as unknown as UseProgressiveJSONResult<T>
}
```

- [ ] **Step 2: Implement the incremental JSON parser core**

The parser is a state machine that scans `rawText` to find top-level key-value pairs. When a value is syntactically complete, it attempts `JSON.parse` on just that value.

Replace the hook body from Step 1:

```typescript
// frontend/src/hooks/useProgressiveJSON.ts
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
 * Returns a map of fieldName → parsed value for fields that are complete.
 */
function extractFields(
  rawText: string,
  schema: Record<string, FieldType>,
): Map<string, unknown> {
  const result = new Map<string, unknown>()
  if (!rawText || rawText.length < 3) return result

  // Find the opening brace of the root object
  const rootStart = rawText.indexOf('{')
  if (rootStart === -1) return result

  const schemaKeys = Object.keys(schema)
  let pos = rootStart + 1

  // Skip whitespace
  const skipWs = (p: number): number => {
    while (p < rawText.length && /\s/.test(rawText[p])) p++
    return p
  }

  // Skip a JSON string, handling escape sequences. Returns position after closing quote.
  const skipString = (p: number): number => {
    if (rawText[p] !== '"') return p
    p++ // skip opening quote
    while (p < rawText.length) {
      if (rawText[p] === '\\') {
        p += 2 // skip escaped character
        continue
      }
      if (rawText[p] === '"') return p + 1 // past closing quote
      p++
    }
    return p // incomplete string
  }

  // Skip a JSON value (string, number, array, object, boolean, null).
  // Returns position after the value, or rawText.length if incomplete.
  const skipValue = (p: number): number => {
    p = skipWs(p)
    if (p >= rawText.length) return p

    const ch = rawText[p]

    // String
    if (ch === '"') return skipString(p)

    // Array or Object — track bracket depth
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

    // Number, boolean, null — read until delimiter
    while (p < rawText.length && !/[\s,\]}]/.test(rawText[p])) p++
    return p
  }

  // Iterate through top-level key-value pairs
  while (pos < rawText.length) {
    pos = skipWs(pos)
    if (pos >= rawText.length || rawText[pos] === '}') break

    // Expect a key (string)
    if (rawText[pos] !== '"') break
    const keyStart = pos + 1
    pos = skipString(pos)
    const key = rawText.slice(keyStart, pos - 1)

    // Skip colon
    pos = skipWs(pos)
    if (pos >= rawText.length || rawText[pos] !== ':') break
    pos++
    pos = skipWs(pos)

    // Value
    const valueStart = pos
    pos = skipValue(pos)
    const valueEnd = pos

    // Only include if the value is complete (we didn't hit end of text)
    if (valueEnd < rawText.length || rawText[valueEnd - 1] === '"' || /\d/.test(rawText[valueEnd - 1])) {
      // Check if we're only in this key's schema
      if (schemaKeys.includes(key)) {
        const valueStr = rawText.slice(valueStart, valueEnd).trim()
        try {
          const parsed = JSON.parse(valueStr)
          result.set(key, parsed)
        } catch {
          // Incomplete or invalid — skip, will retry on next chunk
        }
      }
    }

    // Skip comma
    pos = skipWs(pos)
    if (pos < rawText.length && rawText[pos] === ',') pos++
  }

  return result
}

export function useProgressiveJSON<T extends Record<string, unknown>>(
  rawText: string,
  schema: Record<string, FieldType>,
  streamStatus: StreamStatus,
): UseProgressiveJSONResult<T> {
  return useMemo(() => {
    const schemaKeys = Object.keys(schema) as (keyof T)[]
    const totalFields = schemaKeys.length

    // If stream is done, try to parse the complete JSON
    if (streamStatus === 'done' && rawText) {
      try {
        const fullParsed = JSON.parse(rawText) as T
        const fields = {} as { [K in keyof T]: ProgressiveField<T, K> }
        for (const key of schemaKeys) {
          fields[key] = {
            value: fullParsed[key] ?? null,
            isComplete: true,
            isStreaming: false,
          }
        }
        return {
          fields,
          completedKeys: schemaKeys,
          currentKey: null,
          progress: 100,
          isComplete: true,
        }
      } catch {
        // Fall through to incremental parsing
      }
    }

    // Incremental parsing
    const extracted = extractFields(rawText, schema)
    const completedKeys: (keyof T)[] = []
    const fields = {} as { [K in keyof T]: ProgressiveField<T, K> }
    let lastStreamingKey: string | null = null

    for (const key of schemaKeys) {
      const k = key as string
      if (extracted.has(k)) {
        fields[key] = {
          value: extracted.get(k) as T[typeof key],
          isComplete: true,
          isStreaming: false,
        }
        completedKeys.push(key)
      } else {
        // Check if this field has started (its key appears in rawText)
        const keyPattern = `"${k}"`
        const hasStarted = rawText.includes(keyPattern)
        if (hasStarted && !lastStreamingKey) {
          lastStreamingKey = k
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
      currentKey: lastStreamingKey,
      progress,
      isComplete: completedKeys.length === totalFields,
    }
  }, [rawText, schema, streamStatus])
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useProgressiveJSON.ts
git commit -m "feat: add useProgressiveJSON hook for incremental JSON parsing"
```

---

