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

