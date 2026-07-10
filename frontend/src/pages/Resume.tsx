import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  loadResumeData,
  clearResumeData,
  loadVersions,
  saveVersion,
  deleteVersion,
  type ResumeFormData,
  type ResumeVersion,
} from '../utils/storage'
import { STREAM_ENDPOINTS, type GeneratedResume } from '../services/api'
import { useStream } from '../hooks/useStream'
import ErrorState from '../components/ErrorState'
import VersionHistory from '../components/VersionHistory'
import CareerRoadmap from '../components/CareerRoadmap'

// ─── Editable text field ───

function EditableText({
  value,
  onChange,
  multiline = false,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const save = () => {
    onChange(draft)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className={className}>
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            rows={3}
            className="w-full rounded-xl border border-primary/30 bg-card px-3 py-2 text-sm text-ink focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
          />
        ) : (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-primary/30 bg-card px-3 py-2 text-sm text-ink focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
          />
        )}
        <div className="mt-2 flex gap-2">
          <button
            onClick={save}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white transition hover:bg-primary-dark"
          >
            保存
          </button>
          <button
            onClick={cancel}
            className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-ink-muted transition hover:bg-card"
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${className} group relative cursor-pointer`}
      onClick={() => setEditing(true)}
      title="点击编辑"
    >
      {multiline ? (
        <p className="text-sm leading-relaxed text-ink-light">{value}</p>
      ) : (
        <span className="text-sm text-ink-light">{value}</span>
      )}
      <span className="absolute -right-1 -top-1 hidden rounded-lg bg-primary/10 p-1 text-primary group-hover:block">
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
          />
        </svg>
      </span>
    </div>
  )
}

// ─── Score bar ───

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-muted">{label}</span>
        <span className="font-medium text-ink">{score}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

// ─── Streaming indicator ───

function StreamingIndicator({ rawText }: { rawText: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight
  }, [rawText])

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-3 w-3">
          <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
        </div>
        <span className="text-sm font-medium text-ink">AI 正在生成你的简历...</span>
      </div>
      <div
        ref={containerRef}
        className="max-h-80 overflow-y-auto rounded-xl border border-border bg-ink/[0.03] p-5 font-mono text-xs leading-relaxed text-ink-muted whitespace-pre-wrap"
      >
        {rawText || '连接中...'}
        <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary" />
      </div>
    </div>
  )
}

// ─── Main component ───

export default function Resume() {
  const navigate = useNavigate()
  const data: ResumeFormData = loadResumeData()
  const hasProfile = data.profile.name.trim() !== ''

  const {
    status,
    data: aiResult,
    rawText,
    errorMsg,
    start,
  } = useStream<GeneratedResume>(STREAM_ENDPOINTS.resumeGenerate)

  // Editable AI content state
  const [editedResult, setEditedResult] = useState<GeneratedResume | null>(null)
  const [versions, setVersions] = useState<ResumeVersion[]>(loadVersions)
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null)
  const [editDirty, setEditDirty] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)

  // Current displayed result
  const displayResult = editedResult ?? aiResult

  // When AI finishes, save as first version
  useEffect(() => {
    if (status === 'done' && aiResult && !editedResult) {
      const v = saveVersion({ label: 'AI 生成 v1', data: aiResult })
      setActiveVersionId(v.id)
      setVersions(loadVersions())
    }
  }, [status, aiResult, editedResult])

  const startGeneration = useCallback(() => {
    setEditedResult(null)
    setEditDirty(false)
    setActiveVersionId(null)
    start({
      name: data.profile.name,
      email: data.profile.email,
      location: data.profile.location,
      education: data.education,
      skills: data.skills,
      projects: data.projects,
      targetRole: data.targetRole,
    })
  }, [data, start])

  useEffect(() => {
    if (hasProfile) startGeneration()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = startGeneration

  const handleClearData = () => {
    if (window.confirm('确定要清除所有简历数据吗？此操作不可恢复。')) {
      clearResumeData()
      navigate('/create')
    }
  }

  // ─── Edit handlers ───

  const handleSummaryChange = (summary: string) => {
    if (!displayResult) return
    setEditedResult({ ...displayResult, summary })
    setEditDirty(true)
  }

  const handleSkillsChange = (skills: string[]) => {
    if (!displayResult) return
    setEditedResult({ ...displayResult, skills })
    setEditDirty(true)
  }

  const handleProjectChange = (index: number, field: 'title' | 'description', value: string) => {
    if (!displayResult) return
    const projects = [...displayResult.projects]
    projects[index] = { ...projects[index], [field]: value }
    setEditedResult({ ...displayResult, projects })
    setEditDirty(true)
  }

  // ─── Version management ───

  const handleSaveVersion = () => {
    if (!displayResult) return
    const versionNum = versions.length + 1
    const v = saveVersion({
      label: editDirty ? `手动编辑 v${versionNum}` : `AI 生成 v${versionNum}`,
      data: displayResult,
    })
    setActiveVersionId(v.id)
    setVersions(loadVersions())
    setEditDirty(false)
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 2000)
  }

  const handleSelectVersion = (v: ResumeVersion) => {
    setEditedResult(v.data)
    setActiveVersionId(v.id)
    setEditDirty(false)
  }

  const handleDeleteVersion = (id: string) => {
    deleteVersion(id)
    setVersions(loadVersions())
    if (id === activeVersionId) setActiveVersionId(null)
  }

  const handleRemoveSkill = (skill: string) => {
    handleSkillsChange(displayResult!.skills.filter((s) => s !== skill))
  }

  // ─── Render states ───

  if (!hasProfile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-border">
          <svg
            className="h-8 w-8 text-ink-muted"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-xl font-bold text-ink">还没有简历数据</h2>
        <p className="mt-2 text-ink-muted">请先填写个人信息来生成简历。</p>
        <Link
          to="/create"
          className="btn-shine mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          去填写信息
        </Link>
      </div>
    )
  }

  if (status === 'streaming') {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink">AI 简历预览</h1>
        <StreamingIndicator rawText={rawText} />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink">AI 简历预览</h1>
        <ErrorState message={errorMsg} onRetry={handleRetry} />
      </div>
    )
  }

  if (status === 'idle') {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink">AI 简历预览</h1>
        <div className="mt-8 text-center">
          <button
            onClick={handleRetry}
            className="btn-shine rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            开始生成简历
          </button>
        </div>
      </div>
    )
  }

  // Done — editable resume
  const score = displayResult?.score ?? 0
  const dimensions = displayResult?.dimensionScores
  const breakdown = displayResult?.scoreBreakdown
  const advice = displayResult?.advice ?? []
  const aiSummary = displayResult?.summary ?? ''
  const aiSkills = displayResult?.skills ?? []
  const aiProjects = displayResult?.projects ?? []
  const [showBreakdown, setShowBreakdown] = useState(false)

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">AI 简历预览</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-ink-muted">
            <span>点击内容可直接编辑</span>
            {editDirty && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                有未保存的修改
              </span>
            )}
            {saveFlash && (
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                已保存 ✓
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClearData}
            className="rounded-xl border border-error/30 px-4 py-2 text-sm font-medium text-error/80 transition hover:bg-error/5"
          >
            清除数据
          </button>
          <button
            onClick={() => navigate('/create')}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-card"
          >
            重新编辑
          </button>
          <button
            onClick={handleRetry}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-card"
          >
            重新生成
          </button>
          <Link
            to="/export"
            className="btn-shine rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            导出PDF
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
        {/* Main content area */}
        <div className="space-y-6">
          {/* Resume card */}
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-8 py-6">
              <h2 className="text-2xl font-bold text-ink">{data.profile.name}</h2>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-muted">
                {data.profile.email && <span>{data.profile.email}</span>}
                {data.education?.school && <span>{data.education.school}</span>}
                {data.education?.major && <span>{data.education.major}</span>}
                {data.profile.location && <span>{data.profile.location}</span>}
              </div>
              {(data.education?.degree || data.education?.startDate || data.education?.endDate) && (
                <div className="mt-1 text-sm text-ink-muted">
                  {data.education.degree && <span>{data.education.degree}</span>}
                  {(data.education.startDate || data.education.endDate) && (
                    <span className="ml-2 text-xs text-ink-muted/60">
                      {data.education.startDate} ~ {data.education.endDate}
                    </span>
                  )}
                </div>
              )}
              {data.targetRole && (
                <div className="mt-3">
                  <span className="inline-block rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                    目标岗位：{data.targetRole}
                  </span>
                </div>
              )}

              {/* Editable summary */}
              {aiSummary && (
                <div className="mt-4">
                  <div className="mb-1 text-xs font-medium text-ink-muted">个人简介</div>
                  <EditableText value={aiSummary} onChange={handleSummaryChange} multiline />
                </div>
              )}
            </div>

            {/* Editable skills */}
            {(aiSkills.length > 0 || data.skills.length > 0) && (
              <div className="border-b border-border px-8 py-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    技能
                  </h3>
                  <span className="text-[10px] text-ink-muted/40">点击 × 移除</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(aiSkills.length > 0 ? aiSkills : data.skills).map((skill) => (
                    <span
                      key={skill}
                      className="group/skill inline-flex items-center gap-1.5 rounded-full bg-surface-warm px-3 py-1.5 text-sm text-ink-light transition hover:bg-border"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="hidden text-ink-muted/40 transition group-hover/skill:inline hover:text-error"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Editable projects */}
            {(aiProjects.length > 0 || data.projects.length > 0) && (
              <div className="px-8 py-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  项目经历
                </h3>
                <div className="space-y-5">
                  {(aiProjects.length > 0
                    ? aiProjects
                    : data.projects.map((p) => ({
                        title: p.name,
                        description: p.description,
                        technology: p.technology
                          ? p.technology.split(/[,，]/).map((s) => s.trim())
                          : [],
                      }))
                  ).map((project, index) => (
                    <div key={index} className="rounded-xl border border-border-light p-4">
                      <EditableText
                        value={project.title}
                        onChange={(v) => handleProjectChange(index, 'title', v)}
                        className="text-base font-semibold text-ink"
                      />
                      {project.technology && project.technology.length > 0 && (
                        <p className="mt-0.5 text-sm text-ink-muted">
                          技术栈：{project.technology.join('、')}
                        </p>
                      )}
                      {project.description && (
                        <div className="mt-2">
                          <EditableText
                            value={project.description}
                            onChange={(v) => handleProjectChange(index, 'description', v)}
                            multiline
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Score & Advice cards */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                简历评分
              </h3>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-2xl font-extrabold text-white shadow-lg shadow-primary/20">
                  {score}
                </div>
                <div>
                  <p className="text-lg font-bold text-ink">
                    {score >= 90 ? '优秀' : score >= 75 ? '良好' : score >= 60 ? '一般' : '待改进'}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {score >= 75 ? '仍有优化空间' : '建议进一步优化'}
                  </p>
                </div>
              </div>
              {dimensions && (
                <div className="mt-5 space-y-3">
                  <ScoreBar label="内容完整度" score={dimensions.contentCompleteness} />
                  <ScoreBar label="岗位匹配度" score={dimensions.jobMatch} />
                  <ScoreBar label="关键词覆盖" score={dimensions.keywordCoverage} />
                </div>
              )}
              {breakdown && (
                <div className="mt-4 border-t border-border pt-4">
                  <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="flex w-full items-center justify-between text-xs font-medium text-primary transition hover:text-primary-dark"
                  >
                    <span>查看评分明细</span>
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${showBreakdown ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                  {showBreakdown && (
                    <div className="mt-3 space-y-3 text-xs">
                      {(
                        Object.entries(breakdown) as Array<
                          [string, { score: number; weight: number; reasons: string[] }]
                        >
                      ).map(([key, dim]) => {
                        const labels: Record<string, string> = {
                          starCompleteness: 'STAR 完整性',
                          quantitativeMetrics: '量化指标',
                          keywordDensity: '关键词密度',
                          actionVerbs: '动作动词',
                          contentCompleteness: '内容完整度',
                          jobMatch: '岗位匹配',
                          lengthBalance: '长度均衡',
                        }
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between">
                              <span className="text-ink-muted">
                                {labels[key] || key}
                                <span className="ml-1 text-ink-muted/50">({dim.weight}%)</span>
                              </span>
                              <span
                                className={`font-medium ${dim.score >= 70 ? 'text-success' : dim.score >= 40 ? 'text-accent' : 'text-error'}`}
                              >
                                {dim.score}
                              </span>
                            </div>
                            {dim.reasons.length > 0 && (
                              <ul className="mt-1 space-y-0.5 pl-2 text-ink-muted/70">
                                {dim.reasons.map((r, i) => (
                                  <li key={i}>• {r}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                AI 优化建议
              </h3>
              <ul className="mt-4 space-y-3">
                {advice.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink-light">
                    <span className="mt-0.5 text-accent">⚠</span>
                    {item}
                  </li>
                ))}
                {advice.length === 0 && <li className="text-sm text-ink-muted">暂无建议</li>}
              </ul>
              <button
                onClick={() => navigate('/optimize')}
                className="mt-5 w-full rounded-xl border border-primary/30 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                查看详细优化方案
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar: Version history + Career roadmap + Save */}
        <div className="space-y-4">
          {/* Save button */}
          {editDirty && (
            <button
              onClick={handleSaveVersion}
              className="btn-shine w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark"
            >
              保存当前版本
            </button>
          )}

          {/* Career roadmap */}
          {displayResult && (
            <CareerRoadmap
              skills={data.skills}
              projects={data.projects}
              targetRole={data.targetRole}
              scoreBreakdown={displayResult.scoreBreakdown}
            />
          )}

          {/* Version history */}
          <VersionHistory
            versions={versions}
            activeVersionId={activeVersionId}
            onSelect={handleSelectVersion}
            onDelete={handleDeleteVersion}
          />
        </div>
      </div>
    </div>
  )
}
