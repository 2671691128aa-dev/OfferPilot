# Streaming UX Progressive Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw JSON scrolling with structured field-by-field progressive reveal across all AI features, using an incremental JSON parser on the frontend with zero backend route changes.

**Architecture:** Frontend-only `useProgressiveJSON` hook consumes `rawText` from the existing `useStream` SSE hook. A state machine scans incoming text character-by-character, tracking JSON string boundaries and bracket depth. When a top-level field's value is complete, it's parsed independently and exposed to the UI. Animation components (`TypeWriterText`, `PopInTag`, `CountUpNumber`) render each field as it arrives. Backend prompts get field-order hints only.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4 (CSS `@theme` config), `requestAnimationFrame` for animations.

## Global Constraints

- Backend SSE protocol (chunk/done/error events) must not change
- Backend route files must not change
- `streamAI()` function must not change
- All animations must use CSS `transform` + `opacity` only (GPU-accelerated, no reflow)
- All animations must respect `prefers-reduced-motion: reduce` (disable instantly)
- `PopInTag` total stagger must not exceed 800ms
- Each page must have a cancel button during streaming (call `abort()`)
- `done` event must force-fill all remaining fields (degradation guarantee)

---

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

### Task 4: CSS Animation Utilities

**Files:**
- Modify: `frontend/src/index.css:183-192` (append new keyframes and utilities)

- [ ] **Step 1: Add animation CSS to `index.css`**

Append before the `prefers-reduced-motion` media query block (before line 183):

```css
/* ─── Streaming fade-up animation ─── */

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fade-up 200ms ease-out both;
  will-change: transform, opacity;
}

/* ─── Streaming pop-in animation ─── */

@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-pop-in {
  animation: pop-in 200ms ease-out both;
  will-change: transform, opacity;
}
```

Also update the `prefers-reduced-motion` block to include the new animations:

```css
/* ─── Reduced motion ─── */

@media (prefers-reduced-motion: reduce) {
  .orb,
  .card-lift,
  .btn-shine::after,
  .animate-fade-up,
  .animate-pop-in {
    animation: none !important;
    transition: none !important;
  }
  .animate-fade-up,
  .animate-pop-in {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: add fade-up and pop-in animation CSS utilities"
```

---

### Task 5: Backend Prompt Order Constraints

**Files:**
- Modify: `backend/src/prompts/resumePrompt.ts:67-80` (add order instruction to JSON output format)
- Modify: `backend/src/prompts/optimizePrompt.ts:27-33` (add order instruction)
- Modify: `backend/src/prompts/jdPrompt.ts:28-34` (add order instruction)
- Modify: `backend/src/prompts/interviewPrompt.ts:109-116` (eval — add order instruction)
- Modify: `backend/src/prompts/interviewPrompt.ts:160-168` (report — add order instruction)
- Modify: `backend/src/prompts/careerRoadmapPrompt.ts:71-92` (add order instruction)

- [ ] **Step 1: Add field order hint to `resumePrompt.ts`**

In `buildResumePrompt`, find the `outputFormat` string (around line 67) and add a line before the JSON template:

Change:
```typescript
  const outputFormat = `
请输出以下 JSON 格式（不要包含其他文字）：
{
  "summary": "个人简介，1-3句话，突出技术能力和目标",
```

To:
```typescript
  const outputFormat = `
请严格按以下顺序输出 JSON 字段（先输出 summary，再输出 skills，再输出 projects，最后输出 advice），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "summary": "个人简介，1-3句话，突出技术能力和目标",
```

- [ ] **Step 2: Add field order hint to `optimizePrompt.ts`**

In `buildOptimizePrompt`, find the JSON template (around line 28) and add:

Change:
```typescript
请输出以下 JSON 格式（不要包含其他文字）：
{
  "score": 简历整体评分(0-100的整数),
```

To:
```typescript
请严格按以下顺序输出 JSON 字段（先输出 score，再输出 advantages，再输出 problems，最后输出 suggestions），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "score": 简历整体评分(0-100的整数),
```

- [ ] **Step 3: Add field order hint to `jdPrompt.ts`**

Change:
```typescript
请输出以下 JSON 格式（不要包含其他文字）：
{
  "matchScore": 匹配度百分比(0-100的整数),
```

To:
```typescript
请严格按以下顺序输出 JSON 字段（先输出 matchScore，再输出 requiredSkills，再输出 advantages，最后输出 gaps），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "matchScore": 匹配度百分比(0-100的整数),
```

- [ ] **Step 4: Add field order hint to `interviewPrompt.ts` — eval function**

In `buildAnswerEvalPrompt`, change:
```typescript
请输出以下 JSON 格式（不要包含其他文字）：
{
  "score": 评分(0-100整数),
```

To:
```typescript
请严格按以下顺序输出 JSON 字段（先输出 score，再输出 strengths，再输出 weaknesses，再输出 suggestedImprovement，最后输出 strongExample），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "score": 评分(0-100整数),
```

- [ ] **Step 5: Add field order hint to `interviewPrompt.ts` — report function**

In `buildInterviewReportPrompt`, change:
```typescript
请输出以下 JSON 格式（不要包含其他文字）：
{
  "overallScore": 综合评分(0-100整数),
```

To:
```typescript
请严格按以下顺序输出 JSON 字段（先输出 overallScore，再输出 topStrengths，再输出 keyImprovements，再输出 practiceTopics，最后输出 summary），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "overallScore": 综合评分(0-100整数),
```

- [ ] **Step 6: Add field order hint to `careerRoadmapPrompt.ts`**

Change:
```typescript
请输出以下 JSON 格式（不要包含其他文字）：
{
  "currentLevel": "入门/初级/中级（根据技能数量、项目质量、评分综合判断）",
```

To:
```typescript
请严格按以下顺序输出 JSON 字段（先输出 currentLevel，再输出 levelAnalysis，再输出 skillGaps，再输出 projectSuggestions，再输出 shortTermPlan，再输出 midTermPlan，最后输出 recommendedResources），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "currentLevel": "入门/初级/中级（根据技能数量、项目质量、评分综合判断）",
```

- [ ] **Step 7: Verify backend compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add backend/src/prompts/
git commit -m "feat: add field output order hints to all AI prompts for progressive reveal"
```

---

### Task 6: Resume Page — Progressive Streaming

**Files:**
- Modify: `frontend/src/pages/Resume.tsx`

**Interfaces:**
- Consumes: `useProgressiveJSON`, `StreamProgress`, `StreamCancel`, `CountUpNumber`, `TypeWriterText`, `PopInTag`, `useStream`
- Produces: Streaming mode with structured progressive reveal replacing `StreamingIndicator`

- [ ] **Step 1: Add imports and schema to `Resume.tsx`**

At the top of `frontend/src/pages/Resume.tsx`, add these imports (after existing imports):

```typescript
import { useProgressiveJSON } from '../hooks/useProgressiveJSON'
import StreamProgress from '../components/StreamProgress'
import StreamCancel from '../components/StreamCancel'
import CountUpNumber from '../components/CountUpNumber'
import TypeWriterText from '../components/TypeWriterText'
import PopInTag from '../components/PopInTag'
```

Add the schema constant inside the `Resume` component function, after the `useStream` call (around line 177):

```typescript
  const progressive = useProgressiveJSON<GeneratedResume>(rawText, {
    summary: 'string',
    skills: 'array',
    projects: 'array',
    score: 'number',
    advice: 'array',
  }, status)
```

Add the steps config:

```typescript
  const streamSteps = [
    { key: 'summary', label: '个人简介' },
    { key: 'skills', label: '技能描述' },
    { key: 'projects', label: '项目优化' },
    { key: 'score', label: '评分建议' },
  ]
```

- [ ] **Step 2: Replace the streaming state block**

Find the streaming return block (around line 311-318):

```typescript
  if (status === 'streaming') {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink">AI 简历预览</h1>
        <StreamingIndicator rawText={rawText} />
      </div>
    )
  }
```

Replace with:

```typescript
  if (status === 'streaming') {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">AI 简历预览</h1>
          <StreamCancel onCancel={abort} />
        </div>

        <StreamProgress
          steps={streamSteps}
          completedKeys={progressive.completedKeys as string[]}
          currentKey={progressive.currentKey}
          progress={progressive.progress}
        />

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          {/* Header — always visible from localStorage */}
          <div className="border-b border-border px-8 py-6">
            <h2 className="text-2xl font-bold text-ink">{data.profile.name}</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-muted">
              {data.profile.email && <span>{data.profile.email}</span>}
              {data.education?.school && <span>{data.education.school}</span>}
              {data.education?.major && <span>{data.education.major}</span>}
              {data.profile.location && <span>{data.profile.location}</span>}
            </div>
            {data.targetRole && (
              <div className="mt-3">
                <span className="inline-block rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                  目标岗位：{data.targetRole}
                </span>
              </div>
            )}
          </div>

          {/* Summary — progressive */}
          {progressive.fields.summary?.value && (
            <div className="animate-fade-up border-b border-border px-8 py-6">
              <div className="mb-1 text-xs font-medium text-ink-muted">个人简介</div>
              <p className="text-sm leading-relaxed text-ink-light">
                <TypeWriterText text={progressive.fields.summary.value} />
              </p>
            </div>
          )}

          {/* Skills — progressive */}
          {progressive.fields.skills?.value && progressive.fields.skills.value.length > 0 && (
            <div className="animate-fade-up border-b border-border px-8 py-6" style={{ animationDelay: '100ms' }}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">技能</h3>
              <PopInTag items={progressive.fields.skills.value} />
            </div>
          )}

          {/* Projects — progressive */}
          {progressive.fields.projects?.value && progressive.fields.projects.value.length > 0 && (
            <div className="px-8 py-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-muted">项目经历</h3>
              <div className="space-y-4">
                {progressive.fields.projects.value.map((project, index) => (
                  <div
                    key={index}
                    className="animate-fade-up rounded-xl border border-border-light p-4"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <p className="text-base font-semibold text-ink">{project.title}</p>
                    {project.technology && project.technology.length > 0 && (
                      <p className="mt-0.5 text-sm text-ink-muted">
                        技术栈：{project.technology.join('、')}
                      </p>
                    )}
                    {project.description && (
                      <p className="mt-2 text-sm leading-relaxed text-ink-light">
                        {project.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score — progressive */}
          {progressive.fields.score?.value != null && (
            <div className="animate-fade-up border-t border-border px-8 py-6" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-2xl font-extrabold text-white shadow-lg shadow-primary/20">
                  <CountUpNumber value={progressive.fields.score.value} />
                </div>
                <div>
                  <p className="text-lg font-bold text-ink">
                    {progressive.fields.score.value >= 90 ? '优秀' : progressive.fields.score.value >= 75 ? '良好' : progressive.fields.score.value >= 60 ? '一般' : '待改进'}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {progressive.fields.score.value >= 75 ? '仍有优化空间' : '建议进一步优化'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Advice — progressive */}
          {progressive.fields.advice?.value && progressive.fields.advice.value.length > 0 && (
            <div className="animate-fade-up border-t border-border px-8 py-6" style={{ animationDelay: '100ms' }}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">AI 优化建议</h3>
              <ul className="space-y-2">
                {progressive.fields.advice.value.map((item, i) => (
                  <li key={i} className="animate-fade-up flex gap-2 text-sm text-ink-light" style={{ animationDelay: `${i * 80}ms` }}>
                    <span className="mt-0.5 text-accent">⚠</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skeleton placeholders for fields not yet arrived */}
          {!progressive.fields.summary?.value && !progressive.isComplete && (
            <div className="border-b border-border px-8 py-6">
              <div className="mb-2 h-3 w-16 rounded bg-border/60" />
              <div className="h-3 w-3/4 rounded bg-border/40" />
              <div className="mt-2 h-3 w-1/2 rounded bg-border/30" />
            </div>
          )}
        </div>
      </div>
    )
  }
```

- [ ] **Step 3: Destructure `abort` from `useStream` in the Resume component**

The current code uses `start` but doesn't destructure `abort`. Find:

```typescript
  const {
    status,
    data: aiResult,
    rawText,
    errorMsg,
    start,
  } = useStream<GeneratedResume>(STREAM_ENDPOINTS.resumeGenerate)
```

Replace with:

```typescript
  const {
    status,
    data: aiResult,
    rawText,
    errorMsg,
    start,
    abort,
  } = useStream<GeneratedResume>(STREAM_ENDPOINTS.resumeGenerate)
```

- [ ] **Step 4: Remove the old `StreamingIndicator` component**

Delete the `StreamingIndicator` function definition (lines 137-161 in the original file) since it's no longer used.

- [ ] **Step 5: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Resume.tsx
git commit -m "feat: progressive streaming reveal on Resume page"
```

---

### Task 7: Optimize Page — Progressive Streaming

**Files:**
- Modify: `frontend/src/pages/Optimize.tsx`

- [ ] **Step 1: Add imports and schema**

At the top, add imports:

```typescript
import { useProgressiveJSON } from '../hooks/useProgressiveJSON'
import StreamProgress from '../components/StreamProgress'
import StreamCancel from '../components/StreamCancel'
import CountUpNumber from '../components/CountUpNumber'
```

Destructure `abort` from `useStream` (around line 81-87):

```typescript
  const {
    status,
    data: result,
    rawText,
    errorMsg,
    start,
    abort,
  } = useStream<OptimizeResult>(STREAM_ENDPOINTS.resumeOptimize)
```

Add schema and steps inside the component, after the `useStream` call:

```typescript
  const progressive = useProgressiveJSON<OptimizeResult>(rawText, {
    score: 'number',
    advantages: 'array',
    problems: 'array',
    suggestions: 'array',
  }, status)

  const streamSteps = [
    { key: 'score', label: '评分' },
    { key: 'advantages', label: '优势' },
    { key: 'problems', label: '问题' },
    { key: 'suggestions', label: '建议' },
  ]
```

- [ ] **Step 2: Replace the streaming state**

Find:

```typescript
      {currentView === 'streaming' && <StreamingIndicator rawText={rawText} />}
```

Replace with:

```typescript
      {currentView === 'streaming' && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <StreamProgress
              steps={streamSteps}
              completedKeys={progressive.completedKeys as string[]}
              currentKey={progressive.currentKey}
              progress={progressive.progress}
            />
            <StreamCancel onCancel={abort} />
          </div>

          <div className="space-y-6">
            {/* Score */}
            {progressive.fields.score?.value != null && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-3xl font-extrabold text-white shadow-lg shadow-primary/20">
                    <CountUpNumber value={progressive.fields.score.value} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-ink">
                      {progressive.fields.score.value >= 90 ? '优秀' : progressive.fields.score.value >= 75 ? '良好' : progressive.fields.score.value >= 60 ? '一般' : '待改进'}
                    </p>
                    <p className="text-sm text-ink-muted">你的简历基础不错，以下建议可以进一步提升。</p>
                  </div>
                </div>
              </div>
            )}

            {/* Advantages */}
            {progressive.fields.advantages?.value && progressive.fields.advantages.value.length > 0 && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">你的优势</h3>
                <ul className="mt-4 space-y-2">
                  {progressive.fields.advantages.value.map((item, i) => (
                    <li key={i} className="animate-fade-up flex items-start gap-2 text-sm text-ink-light" style={{ animationDelay: `${i * 80}ms` }}>
                      <span className="mt-0.5 text-success">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Problems */}
            {progressive.fields.problems?.value && progressive.fields.problems.value.length > 0 && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">发现问题</h3>
                <ul className="mt-4 space-y-3">
                  {progressive.fields.problems.value.map((problem, i) => (
                    <li key={i} className="animate-fade-up flex items-start gap-3 rounded-xl bg-warning/8 p-3" style={{ animationDelay: `${i * 80}ms` }}>
                      <span className="mt-0.5 text-warning">●</span>
                      <p className="text-sm text-ink-light">{problem}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {progressive.fields.suggestions?.value && progressive.fields.suggestions.value.length > 0 && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">优化建议</h3>
                <ul className="mt-4 space-y-3">
                  {progressive.fields.suggestions.value.map((suggestion, i) => (
                    <li key={i} className="animate-fade-up flex items-start gap-3 rounded-xl bg-success/8 p-3" style={{ animationDelay: `${i * 80}ms` }}>
                      <span className="mt-0.5 text-success">✓</span>
                      <p className="text-sm text-ink-light">{suggestion}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skeleton for pending fields */}
            {progressive.fields.score?.value == null && !progressive.isComplete && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 animate-pulse rounded-2xl bg-border/40" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded bg-border/40" />
                    <div className="h-3 w-48 rounded bg-border/30" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
```

- [ ] **Step 3: Remove the old `StreamingIndicator`**

Delete the `StreamingIndicator` function definition (lines 45-69 in the original file).

- [ ] **Step 4: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Optimize.tsx
git commit -m "feat: progressive streaming reveal on Optimize page"
```

---

### Task 8: Analyze Page — Progressive Streaming

**Files:**
- Modify: `frontend/src/pages/Analyze.tsx`

- [ ] **Step 1: Add imports, schema, and destructure `abort`**

Add imports:

```typescript
import { useProgressiveJSON } from '../hooks/useProgressiveJSON'
import StreamProgress from '../components/StreamProgress'
import StreamCancel from '../components/StreamCancel'
import CountUpNumber from '../components/CountUpNumber'
import PopInTag from '../components/PopInTag'
```

Update `useStream` to include `abort`:

```typescript
  const {
    status,
    data: result,
    rawText,
    errorMsg,
    start,
    abort,
  } = useStream<AnalyzeResult>(STREAM_ENDPOINTS.jobAnalyze)
```

Add schema and steps:

```typescript
  const progressive = useProgressiveJSON<AnalyzeResult>(rawText, {
    matchScore: 'number',
    requiredSkills: 'array',
    advantages: 'array',
    gaps: 'array',
  }, status)

  const streamSteps = [
    { key: 'matchScore', label: '匹配度' },
    { key: 'requiredSkills', label: '岗位技能' },
    { key: 'advantages', label: '你的优势' },
    { key: 'gaps', label: '能力差距' },
  ]
```

- [ ] **Step 2: Replace the streaming state**

Find:

```typescript
      {currentView === 'streaming' && <StreamingIndicator rawText={rawText} />}
```

Replace with:

```typescript
      {currentView === 'streaming' && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <StreamProgress
              steps={streamSteps}
              completedKeys={progressive.completedKeys as string[]}
              currentKey={progressive.currentKey}
              progress={progressive.progress}
            />
            <StreamCancel onCancel={abort} />
          </div>

          <div className="space-y-6">
            {/* Match score */}
            {progressive.fields.matchScore?.value != null && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-3xl font-extrabold text-white shadow-lg shadow-primary/20">
                    <CountUpNumber value={progressive.fields.matchScore.value} />%
                  </div>
                  <div>
                    <p className="text-xl font-bold text-ink">
                      匹配度：{progressive.fields.matchScore.value >= 80 ? '优秀' : progressive.fields.matchScore.value >= 60 ? '良好' : '一般'}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {progressive.fields.matchScore.value >= 60
                        ? '你已具备岗位所需的大部分技能，补充以下内容可以进一步提升竞争力。'
                        : '你与岗位要求有一定差距，建议针对性补充技能。'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Required skills */}
            {progressive.fields.requiredSkills?.value && progressive.fields.requiredSkills.value.length > 0 && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">岗位要求技能</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {progressive.fields.requiredSkills.value.map((skill) => {
                    const userHas = data.skills.some((s) => s.toLowerCase() === skill.toLowerCase())
                    return (
                      <div
                        key={skill}
                        className={`animate-pop-in flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${userHas ? 'bg-success/8 text-success' : 'bg-surface-warm text-ink-muted'}`}
                      >
                        <span>{userHas ? '✓' : '○'}</span>
                        {skill}
                        {userHas && <span className="ml-auto text-xs text-success">已掌握</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Advantages */}
            {progressive.fields.advantages?.value && progressive.fields.advantages.value.length > 0 && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">你的优势</h3>
                <ul className="mt-4 space-y-2">
                  {progressive.fields.advantages.value.map((a, i) => (
                    <li key={i} className="animate-fade-up flex items-start gap-2 text-sm text-ink-light" style={{ animationDelay: `${i * 80}ms` }}>
                      <span className="mt-0.5 text-success">✓</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {progressive.fields.gaps?.value && progressive.fields.gaps.value.length > 0 && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">能力差距</h3>
                <ul className="mt-4 space-y-2">
                  {progressive.fields.gaps.value.map((g, i) => (
                    <li key={i} className="animate-fade-up flex items-start gap-2 text-sm text-ink-light" style={{ animationDelay: `${i * 80}ms` }}>
                      <span className="mt-0.5 text-warning">!</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skeleton */}
            {progressive.fields.matchScore?.value == null && !progressive.isComplete && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-5">
                  <div className="h-20 w-20 animate-pulse rounded-2xl bg-border/40" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-border/40" />
                    <div className="h-3 w-48 rounded bg-border/30" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
```

- [ ] **Step 3: Remove the old `StreamingIndicator`**

Delete the `StreamingIndicator` function definition (lines 8-32 in the original file).

- [ ] **Step 4: Remove unused imports**

Remove `useRef` and `useEffect` from the import if they are no longer needed (check if any other code in the file uses them).

- [ ] **Step 5: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Analyze.tsx
git commit -m "feat: progressive streaming reveal on Analyze page"
```

---

### Task 9: CareerRoadmap — Progressive Streaming

**Files:**
- Modify: `frontend/src/components/CareerRoadmap.tsx`

- [ ] **Step 1: Add imports and progressive parsing**

Add imports:

```typescript
import { useProgressiveJSON } from '../hooks/useProgressiveJSON'
import StreamProgress from './StreamProgress'
```

Add the progressive hook after the `useStream` call (around line 34-41):

```typescript
  const progressive = useProgressiveJSON<CareerRoadmapData>(rawText, {
    currentLevel: 'string',
    levelAnalysis: 'string',
    skillGaps: 'array',
    projectSuggestions: 'array',
    shortTermPlan: 'array',
    midTermPlan: 'array',
    recommendedResources: 'array',
  }, status)

  const streamSteps = [
    { key: 'currentLevel', label: '等级评估' },
    { key: 'skillGaps', label: '技能缺口' },
    { key: 'shortTermPlan', label: '行动计划' },
    { key: 'recommendedResources', label: '推荐资源' },
  ]
```

- [ ] **Step 2: Replace the streaming state block**

Replace the streaming return block (lines 52-69) with:

```typescript
  if (status === 'streaming') {
    return (
      <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
            职业路线图
          </h3>
          <button onClick={abort} className="text-xs text-ink-muted hover:text-error">
            取消
          </button>
        </div>

        <StreamProgress
          steps={streamSteps}
          completedKeys={progressive.completedKeys as string[]}
          currentKey={progressive.currentKey}
          progress={progressive.progress}
        />

        <div className="space-y-3">
          {/* Level badge */}
          {progressive.fields.currentLevel?.value && (
            <div className="animate-fade-up flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-lg font-bold text-white shadow-md">
                {progressive.fields.currentLevel.value[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-ink">{progressive.fields.currentLevel.value}开发者</p>
                {progressive.fields.levelAnalysis?.value && (
                  <p className="text-xs text-ink-muted">{progressive.fields.levelAnalysis.value}</p>
                )}
              </div>
            </div>
          )}

          {/* Skill gaps */}
          {progressive.fields.skillGaps?.value && progressive.fields.skillGaps.value.length > 0 && (
            <div className="animate-fade-up">
              <h4 className="mb-2 text-xs font-medium text-ink-muted">技能缺口</h4>
              <div className="space-y-1.5">
                {progressive.fields.skillGaps.value.map((gap, i) => (
                  <div key={i} className="animate-fade-up flex items-start gap-2 text-xs" style={{ animationDelay: `${i * 80}ms` }}>
                    <span className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 font-medium ${priorityColor[gap.priority] || 'bg-border text-ink-muted'}`}>
                      {gap.priority}
                    </span>
                    <div>
                      <span className="font-medium text-ink">{gap.skill}</span>
                      <span className="text-ink-muted"> — {gap.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Short term plan */}
          {progressive.fields.shortTermPlan?.value && progressive.fields.shortTermPlan.value.length > 0 && (
            <div className="animate-fade-up">
              <h4 className="mb-1 text-xs font-medium text-ink-muted">短期计划（1-2周）</h4>
              <ul className="space-y-0.5">
                {progressive.fields.shortTermPlan.value.map((item, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-ink-light">
                    <span className="text-success">→</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skeleton */}
          {!progressive.fields.currentLevel?.value && !progressive.isComplete && (
            <div className="flex animate-pulse items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-border/40" />
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-border/40" />
                <div className="h-2 w-32 rounded bg-border/30" />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
```

- [ ] **Step 3: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/CareerRoadmap.tsx
git commit -m "feat: progressive streaming reveal on CareerRoadmap"
```

---

### Task 10: Interview Feedback & Report — Progressive Streaming

**Files:**
- Modify: `frontend/src/components/InterviewFeedback.tsx`
- Modify: `frontend/src/pages/Interview.tsx`

- [ ] **Step 1: Add progressive streaming to `InterviewFeedback.tsx`**

Add imports:

```typescript
import { useProgressiveJSON } from '../hooks/useProgressiveJSON'
import CountUpNumber from './CountUpNumber'
import type { StreamStatus } from '../hooks/useStream'
```

Add a new interface for the streaming variant:

```typescript
interface InterviewFeedbackStreamingProps {
  rawText: string
  streamStatus: StreamStatus
}
```

Add a new export component at the bottom of the file:

```typescript
export function InterviewFeedbackStreaming({ rawText, streamStatus }: InterviewFeedbackStreamingProps) {
  const progressive = useProgressiveJSON<{
    score: number
    strengths: string[]
    weaknesses: string[]
    suggestedImprovement: string
    strongExample: string
  }>(rawText, {
    score: 'number',
    strengths: 'array',
    weaknesses: 'array',
    suggestedImprovement: 'string',
    strongExample: 'string',
  }, streamStatus)

  const score = progressive.fields.score?.value
  const scoreColor =
    score != null
      ? score >= 80
        ? 'bg-success/10 text-success'
        : score >= 60
          ? 'bg-accent/10 text-accent'
          : 'bg-error/10 text-error'
      : 'bg-border/40 text-ink-muted'

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      {/* Score */}
      {score != null && (
        <div className="animate-fade-up flex items-center gap-3">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-extrabold ${scoreColor}`}>
            <CountUpNumber value={score} />
          </div>
          <div>
            <p className="text-base font-bold text-ink">
              {score >= 90 ? '优秀' : score >= 75 ? '良好' : score >= 60 ? '一般' : '待改进'}
            </p>
            <p className="text-xs text-ink-muted">回答评分</p>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid gap-4 sm:grid-cols-2">
        {progressive.fields.strengths?.value && progressive.fields.strengths.value.length > 0 && (
          <div className="animate-fade-up">
            <h4 className="mb-2 text-xs font-medium text-success">✓ 优势</h4>
            <ul className="space-y-1">
              {progressive.fields.strengths.value.map((s, i) => (
                <li key={i} className="animate-fade-up flex gap-1.5 text-sm text-ink-light" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="mt-0.5 shrink-0 text-success">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {progressive.fields.weaknesses?.value && progressive.fields.weaknesses.value.length > 0 && (
          <div className="animate-fade-up">
            <h4 className="mb-2 text-xs font-medium text-error">✗ 不足</h4>
            <ul className="space-y-1">
              {progressive.fields.weaknesses.value.map((w, i) => (
                <li key={i} className="animate-fade-up flex gap-1.5 text-sm text-ink-light" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="mt-0.5 shrink-0 text-error">•</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Suggested improvement */}
      {progressive.fields.suggestedImprovement?.value && (
        <div className="animate-fade-up rounded-lg border border-primary/15 bg-primary/[0.03] p-3">
          <h4 className="mb-1 text-xs font-medium text-primary">改进建议</h4>
          <p className="text-sm text-ink-light">{progressive.fields.suggestedImprovement.value}</p>
        </div>
      )}

      {/* Skeleton */}
      {score == null && (
        <div className="flex animate-pulse items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-border/40" />
          <div className="space-y-1.5">
            <div className="h-3 w-16 rounded bg-border/40" />
            <div className="h-2 w-24 rounded bg-border/30" />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Use `InterviewFeedbackStreaming` in `Interview.tsx`**

In `frontend/src/pages/Interview.tsx`, add import:

```typescript
import { InterviewFeedbackStreaming } from '../components/InterviewFeedback'
```

Find the feedback section (around line 362-384) where it shows `InterviewFeedbackCard` during streaming. Replace:

```typescript
          {isEvalStreaming && (
            <InterviewFeedbackCard
              feedback={evalStream.data!}
              isStreaming={true}
              rawText={evalStream.rawText}
            />
          )}
```

With:

```typescript
          {isEvalStreaming && (
            <InterviewFeedbackStreaming
              rawText={evalStream.rawText}
              streamStatus={evalStream.status}
            />
          )}
```

- [ ] **Step 3: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Add `InterviewReportStreaming` to `Interview.tsx` report phase**

In `Interview.tsx`, add import:

```typescript
import { InterviewFeedbackStreaming } from '../components/InterviewFeedback'
import { useProgressiveJSON } from '../hooks/useProgressiveJSON'
import StreamProgress from '../components/StreamProgress'
import CountUpNumber from '../components/CountUpNumber'
import type { InterviewReport as ReportData } from '../services/api'
```

Add a `reportSteps` constant and `reportProgressive` hook inside the component:

```typescript
  const reportSteps = [
    { key: 'overallScore', label: '综合评分' },
    { key: 'topStrengths', label: '核心优势' },
    { key: 'keyImprovements', label: '改进方向' },
    { key: 'practiceTopics', label: '练习话题' },
    { key: 'summary', label: '总结' },
  ]

  const reportProgressive = useProgressiveJSON<ReportData>(reportStream.rawText, {
    overallScore: 'number',
    topStrengths: 'array',
    keyImprovements: 'array',
    practiceTopics: 'array',
    summary: 'string',
  }, reportStream.status)
```

Find the report streaming block (around line 293-311):

```typescript
    if (isReportStreaming) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">面试报告</h1>
          <div className="mt-6 rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
            ...raw text indicator...
          </div>
        </div>
      )
    }
```

Replace with:

```typescript
    if (isReportStreaming) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">面试报告</h1>

          <div className="mt-6">
            <StreamProgress
              steps={reportSteps}
              completedKeys={reportProgressive.completedKeys as string[]}
              currentKey={reportProgressive.currentKey}
              progress={reportProgressive.progress}
            />
          </div>

          <div className="space-y-6">
            {/* Overall score */}
            {reportProgressive.fields.overallScore?.value != null && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-light text-3xl font-extrabold text-white shadow-lg">
                  <CountUpNumber value={reportProgressive.fields.overallScore.value} />
                </div>
                <h2 className="mt-4 text-xl font-bold text-ink">
                  {reportProgressive.fields.overallScore.value >= 90 ? '优秀' : reportProgressive.fields.overallScore.value >= 75 ? '良好' : reportProgressive.fields.overallScore.value >= 60 ? '一般' : '待改进'}
                </h2>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid gap-6 sm:grid-cols-2">
              {reportProgressive.fields.topStrengths?.value && reportProgressive.fields.topStrengths.value.length > 0 && (
                <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-success">核心优势</h3>
                  <ul className="space-y-2">
                    {reportProgressive.fields.topStrengths.value.map((s, i) => (
                      <li key={i} className="animate-fade-up flex gap-2 text-sm text-ink-light" style={{ animationDelay: `${i * 80}ms` }}>
                        <span className="mt-0.5 shrink-0 text-success">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reportProgressive.fields.keyImprovements?.value && reportProgressive.fields.keyImprovements.value.length > 0 && (
                <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-error">改进方向</h3>
                  <ul className="space-y-2">
                    {reportProgressive.fields.keyImprovements.value.map((item, i) => (
                      <li key={i} className="animate-fade-up flex gap-2 text-sm text-ink-light" style={{ animationDelay: `${i * 80}ms` }}>
                        <span className="mt-0.5 shrink-0 text-error">→</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Practice topics */}
            {reportProgressive.fields.practiceTopics?.value && reportProgressive.fields.practiceTopics.value.length > 0 && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">推荐练习话题</h3>
                <div className="flex flex-wrap gap-2">
                  {reportProgressive.fields.practiceTopics.value.map((topic, i) => (
                    <span key={i} className="rounded-full bg-primary/8 px-3 py-1.5 text-sm font-medium text-primary">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {reportProgressive.fields.summary?.value && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">面试总结</h3>
                <p className="text-sm leading-relaxed text-ink-light">{reportProgressive.fields.summary.value}</p>
              </div>
            )}

            {/* Skeleton */}
            {reportProgressive.fields.overallScore?.value == null && (
              <div className="animate-pulse rounded-2xl border border-border bg-card p-8 text-center">
                <div className="mx-auto h-20 w-20 rounded-3xl bg-border/40" />
                <div className="mx-auto mt-4 h-4 w-24 rounded bg-border/40" />
              </div>
            )}
          </div>
        </div>
      )
    }
```

- [ ] **Step 4: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/InterviewFeedback.tsx frontend/src/pages/Interview.tsx
git commit -m "feat: progressive streaming reveal on Interview feedback and report"
```

---

### Task 11: Fix `ErrorState` Component Styling

**Files:**
- Modify: `frontend/src/components/ErrorState.tsx`

- [ ] **Step 1: Update ErrorState to use design tokens instead of hardcoded colors**

Replace the entire file content with:

```tsx
interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
        <svg
          className="h-8 w-8 text-error"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <p className="mt-6 text-lg font-medium text-ink">AI 服务异常</p>
      <p className="mt-1 text-sm text-ink-muted">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
      >
        重试
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ErrorState.tsx
git commit -m "fix: use design tokens in ErrorState instead of hardcoded colors"
```

---

### Task 12: Final Verification & Push

- [ ] **Step 1: Run full type check**

Run: `cd frontend && npx tsc --noEmit && cd ../backend && npx tsc --noEmit`
Expected: No errors in either.

- [ ] **Step 2: Run dev server and verify all pages load**

Run: `cd frontend && npm run dev`

Navigate to:
- `/resume` — verify streaming shows structured progressive reveal
- `/optimize` — verify streaming shows progressive reveal
- `/analyze` — verify streaming shows progressive reveal
- `/interview` — verify interview feedback streaming shows progressive reveal

Verify cancel buttons work on all streaming pages.
Verify error states display correctly.
Verify completed state transitions are smooth (no layout jumps).

- [ ] **Step 3: Push everything**

```bash
git push
```

- [ ] **Step 4: Verify deployment**

After CI/CD completes, test on production URLs.
