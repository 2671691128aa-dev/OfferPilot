import { useState } from 'react'
import { useStream } from '../hooks/useStream'
import { useProgressiveJSON } from '../hooks/useProgressiveJSON'
import { STREAM_ENDPOINTS, type ScoreBreakdown } from '../services/api'
import StreamProgress from './StreamProgress'

interface CareerRoadmapData {
  currentLevel: string
  levelAnalysis: string
  skillGaps: Array<{ skill: string; priority: string; reason: string }>
  projectSuggestions: Array<{ title: string; description: string; skillsLearned: string[] }>
  shortTermPlan: string[]
  midTermPlan: string[]
  recommendedResources: string[]
}

interface CareerRoadmapProps {
  skills: string[]
  projects: Array<{ name: string; description: string; technology: string; role: string }>
  targetRole: string
  scoreBreakdown?: ScoreBreakdown
}

const priorityColor: Record<string, string> = {
  高: 'bg-error/10 text-error',
  中: 'bg-accent/10 text-accent',
  低: 'bg-success/10 text-success',
}

const streamSteps = [
  { key: 'currentLevel', label: '等级评估' },
  { key: 'skillGaps', label: '技能缺口' },
  { key: 'shortTermPlan', label: '行动计划' },
  { key: 'recommendedResources', label: '推荐资源' },
]

export default function CareerRoadmap({
  skills,
  projects,
  targetRole,
  scoreBreakdown,
}: CareerRoadmapProps) {
  const {
    status,
    data: roadmap,
    rawText,
    errorMsg,
    start,
    abort,
  } = useStream<CareerRoadmapData>(STREAM_ENDPOINTS.careerRoadmap)

  const progressive = useProgressiveJSON<CareerRoadmapData>(
    rawText,
    {
      currentLevel: 'string',
      levelAnalysis: 'string',
      skillGaps: 'array',
      projectSuggestions: 'array',
      shortTermPlan: 'array',
      midTermPlan: 'array',
      recommendedResources: 'array',
    },
    status,
  )

  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleGenerate = () => {
    start({ skills, projects, targetRole, scoreBreakdown })
  }

  // Streaming state
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
                <p className="text-sm font-bold text-ink">
                  {progressive.fields.currentLevel.value}开发者
                </p>
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
                  <div
                    key={i}
                    className="animate-fade-up flex items-start gap-2 text-xs"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <span
                      className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 font-medium ${priorityColor[gap.priority] || 'bg-border text-ink-muted'}`}
                    >
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
          {progressive.fields.shortTermPlan?.value &&
            progressive.fields.shortTermPlan.value.length > 0 && (
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

  // Error state
  if (status === 'error') {
    return (
      <div className="rounded-2xl border border-error/20 bg-card p-6 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-error">职业路线图</h3>
        <p className="mt-2 text-sm text-ink-muted">{errorMsg}</p>
        <button
          onClick={handleGenerate}
          className="mt-3 text-sm font-medium text-primary hover:text-primary-dark"
        >
          重试
        </button>
      </div>
    )
  }

  // Done state — show roadmap
  if (status === 'done' && roadmap) {
    const levelColor =
      roadmap.currentLevel === '中级'
        ? 'from-success to-success/80'
        : roadmap.currentLevel === '初级'
          ? 'from-primary to-primary-light'
          : 'from-accent to-accent/80'

    return (
      <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
            职业路线图
          </h3>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-ink-muted hover:text-error"
          >
            收起
          </button>
        </div>

        {/* Level badge */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${levelColor} text-lg font-bold text-white shadow-md`}
          >
            {roadmap.currentLevel[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-ink">{roadmap.currentLevel}开发者</p>
            <p className="text-xs text-ink-muted">{roadmap.levelAnalysis}</p>
          </div>
        </div>

        {/* Skill gaps */}
        {roadmap.skillGaps.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-medium text-ink-muted">技能缺口</h4>
            <div className="space-y-1.5">
              {roadmap.skillGaps.map((gap, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span
                    className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 font-medium ${priorityColor[gap.priority] || 'bg-border text-ink-muted'}`}
                  >
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

        {/* Project suggestions */}
        {roadmap.projectSuggestions.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-medium text-ink-muted">推荐项目</h4>
            <div className="space-y-2">
              {roadmap.projectSuggestions.map((proj, i) => (
                <div key={i} className="rounded-lg border border-border-light p-2.5">
                  <p className="text-xs font-medium text-ink">{proj.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{proj.description}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {proj.skillsLearned.map((s, j) => (
                      <span
                        key={j}
                        className="rounded-full bg-primary/8 px-1.5 py-0.5 text-[10px] text-primary"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="space-y-3">
          {roadmap.shortTermPlan.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-ink-muted">短期计划（1-2周）</h4>
              <ul className="space-y-0.5">
                {roadmap.shortTermPlan.map((item, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-ink-light">
                    <span className="text-success">→</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {roadmap.midTermPlan.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-ink-muted">中期计划（1-3月）</h4>
              <ul className="space-y-0.5">
                {roadmap.midTermPlan.map((item, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-ink-light">
                    <span className="text-primary">→</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Resources */}
        {roadmap.recommendedResources.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <h4 className="mb-1.5 text-xs font-medium text-ink-muted">推荐资源</h4>
            <div className="flex flex-wrap gap-1.5">
              {roadmap.recommendedResources.map((res, i) => (
                <span
                  key={i}
                  className="rounded-full bg-surface-warm px-2 py-0.5 text-[10px] text-ink-light"
                >
                  {res}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Idle state — show generate button
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">职业路线图</h3>
      <p className="mt-2 text-sm text-ink-muted">
        基于你的技能、项目和评分，AI 为你生成个性化成长计划。
      </p>
      <button
        onClick={handleGenerate}
        className="mt-4 w-full rounded-xl border border-primary/30 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
      >
        生成职业路线图
      </button>
    </div>
  )
}
