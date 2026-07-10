import { useState, useEffect, useCallback } from 'react'
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
import { useProgressiveJSON } from '../hooks/useProgressiveJSON'
import StreamProgress from '../components/StreamProgress'
import StreamCancel from '../components/StreamCancel'
import CountUpNumber from '../components/CountUpNumber'
import TypeWriterText from '../components/TypeWriterText'
import PopInTag from '../components/PopInTag'
import EditableText from '../components/EditableText'
import ScoreBar from '../components/ScoreBar'

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
    abort,
  } = useStream<GeneratedResume>(STREAM_ENDPOINTS.resumeGenerate)

  const progressive = useProgressiveJSON<GeneratedResume>(
    rawText,
    {
      summary: 'string',
      skills: 'array',
      projects: 'array',
      score: 'number',
      advice: 'array',
    },
    status,
  )

  const streamSteps = [
    { key: 'summary', label: '个人简介' },
    { key: 'skills', label: '技能描述' },
    { key: 'projects', label: '项目优化' },
    { key: 'score', label: '评分建议' },
  ]

  // Editable AI content state
  const [editedResult, setEditedResult] = useState<GeneratedResume | null>(null)
  const [versions, setVersions] = useState<ResumeVersion[]>(loadVersions)
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null)
  const [editDirty, setEditDirty] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

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
            <div
              className="animate-fade-up border-b border-border px-8 py-6"
              style={{ animationDelay: '100ms' }}
            >
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                技能
              </h3>
              <PopInTag items={progressive.fields.skills.value} />
            </div>
          )}

          {/* Projects — progressive */}
          {progressive.fields.projects?.value && progressive.fields.projects.value.length > 0 && (
            <div className="px-8 py-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                项目经历
              </h3>
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
            <div
              className="animate-fade-up border-t border-border px-8 py-6"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-2xl font-extrabold text-white shadow-lg shadow-primary/20">
                  <CountUpNumber value={progressive.fields.score.value} />
                </div>
                <div>
                  <p className="text-lg font-bold text-ink">
                    {progressive.fields.score.value >= 90
                      ? '优秀'
                      : progressive.fields.score.value >= 75
                        ? '良好'
                        : progressive.fields.score.value >= 60
                          ? '一般'
                          : '待改进'}
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
            <div
              className="animate-fade-up border-t border-border px-8 py-6"
              style={{ animationDelay: '100ms' }}
            >
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                AI 优化建议
              </h3>
              <ul className="space-y-2">
                {progressive.fields.advice.value.map((item, i) => (
                  <li
                    key={i}
                    className="animate-fade-up flex gap-2 text-sm text-ink-light"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
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
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">AI 简历</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">AI 简历预览</h1>
        </div>
        <div className="mt-8 rounded-2xl border border-border bg-card p-12 text-center shadow-lg shadow-border/20">
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

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">AI 简历</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">AI 简历预览</h1>
            <div className="mt-1.5 flex items-center gap-3 text-sm text-ink-muted">
              <svg
                className="h-4 w-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                />
              </svg>
              <span>点击内容可直接编辑</span>
              {editDirty && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  有未保存的修改
                </span>
              )}
              {saveFlash && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  已保存
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleClearData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-error/20 px-4 py-2 text-sm font-medium text-error/70 transition hover:border-error/40 hover:bg-error/5"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
              清除
            </button>
            <button
              onClick={() => navigate('/create')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-card hover:text-ink"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                />
              </svg>
              编辑
            </button>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/5"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                />
              </svg>
              重新生成
            </button>
            <Link
              to="/export"
              className="btn-shine inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              导出 PDF
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Main content area */}
        <div className="space-y-6">
          {/* Resume card */}
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg shadow-border/20">
            <div className="border-b border-border bg-gradient-to-b from-surface-warm/50 to-card px-8 py-6">
              <h2 className="text-2xl font-extrabold text-ink">{data.profile.name}</h2>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
                {data.profile.email && (
                  <span className="inline-flex items-center gap-1">
                    <svg
                      className="h-3.5 w-3.5 text-ink-muted/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                      />
                    </svg>
                    {data.profile.email}
                  </span>
                )}
                {data.education?.school && (
                  <span className="inline-flex items-center gap-1">
                    <svg
                      className="h-3.5 w-3.5 text-ink-muted/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"
                      />
                    </svg>
                    {data.education.school}
                  </span>
                )}
                {data.education?.major && <span>{data.education.major}</span>}
                {data.profile.location && (
                  <span className="inline-flex items-center gap-1">
                    <svg
                      className="h-3.5 w-3.5 text-ink-muted/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                      />
                    </svg>
                    {data.profile.location}
                  </span>
                )}
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
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
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
                        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
                      />
                    </svg>
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
            <div className="card-hover-lift rounded-2xl border border-border/80 bg-gradient-to-b from-card to-surface-warm/30 p-6 shadow-lg shadow-border/10">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  简历评分
                </h3>
                <svg
                  className="h-4 w-4 text-primary/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                  />
                </svg>
              </div>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-2xl font-extrabold text-white shadow-xl shadow-primary/25">
                  {score}
                </div>
                <div>
                  <p className="text-xl font-bold text-ink">
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

            <div className="card-hover-lift rounded-2xl border border-border/80 bg-gradient-to-b from-card to-surface-warm/30 p-6 shadow-lg shadow-border/10">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  AI 优化建议
                </h3>
                <svg
                  className="h-4 w-4 text-accent/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                  />
                </svg>
              </div>
              <ul className="mt-4 space-y-3">
                {advice.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 rounded-xl bg-accent/[0.04] px-3 py-2.5 text-sm text-ink-light"
                  >
                    <span className="mt-0.5 shrink-0 text-accent">💡</span>
                    {item}
                  </li>
                ))}
                {advice.length === 0 && <li className="text-sm text-ink-muted">暂无建议</li>}
              </ul>
              <button
                onClick={() => navigate('/optimize')}
                className="card-hover-lift mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.03] py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                  />
                </svg>
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
