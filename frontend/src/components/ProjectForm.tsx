import { useState } from 'react'
import { optimizeProjectDescription } from '../services/api'

export interface ProjectData {
  name: string
  description: string
  technology: string
  role: string
}

interface ProjectFormProps {
  projects: ProjectData[]
  onChange: (projects: ProjectData[]) => void
}

const emptyProject: ProjectData = { name: '', description: '', technology: '', role: '' }

const inputClass =
  'mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-muted/50 transition focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none'

export default function ProjectForm({ projects, onChange }: ProjectFormProps) {
  const [optimizingIndex, setOptimizingIndex] = useState<number | null>(null)
  const [optimizeError, setOptimizeError] = useState<string | null>(null)

  const addProject = () => onChange([...projects, { ...emptyProject }])
  const removeProject = (i: number) => onChange(projects.filter((_, idx) => idx !== i))
  const updateProject = (i: number, field: keyof ProjectData, value: string) => {
    const updated = [...projects]
    updated[i] = { ...updated[i], [field]: value }
    onChange(updated)
  }

  const handleOptimize = async (index: number) => {
    const project = projects[index]
    if (!project.name.trim()) {
      setOptimizeError('请先填写项目名称')
      setTimeout(() => setOptimizeError(null), 2000)
      return
    }

    setOptimizingIndex(index)
    setOptimizeError(null)
    try {
      const result = await optimizeProjectDescription({
        name: project.name,
        description: project.description,
        technology: project.technology,
        role: project.role,
      })

      if (project.description.trim()) {
        const confirmed = window.confirm(
          `AI 将替换当前项目描述。\n\n当前：\n${project.description}\n\n替换为：\n${result.optimizedDescription}\n\n确认替换？`,
        )
        if (confirmed) updateProject(index, 'description', result.optimizedDescription)
      } else {
        updateProject(index, 'description', result.optimizedDescription)
      }
    } catch (err: unknown) {
      setOptimizeError(err instanceof Error ? err.message : 'AI 优化失败')
      setTimeout(() => setOptimizeError(null), 3000)
    } finally {
      setOptimizingIndex(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-ink-light">项目经历</label>
        <button
          type="button"
          onClick={addProject}
          className="inline-flex items-center gap-1 rounded-lg bg-primary/8 px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/15"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          添加项目
        </button>
      </div>

      {optimizeError && (
        <div className="mt-3 rounded-xl bg-error/10 px-4 py-2.5 text-sm text-error">
          {optimizeError}
        </div>
      )}

      {projects.length === 0 && (
        <div className="mt-4 rounded-xl border-2 border-dashed border-border p-10 text-center">
          <svg
            className="mx-auto h-10 w-10 text-ink-muted/40"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
            />
          </svg>
          <p className="mt-3 text-sm text-ink-muted">点击上方「添加项目」开始填写</p>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {projects.map((project, index) => (
          <div key={index} className="rounded-xl border border-border bg-surface-warm/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                项目 {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeProject(index)}
                className="text-sm text-error/70 transition hover:text-error"
              >
                删除
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink-muted">项目名称</label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => updateProject(index, 'name', e.target.value)}
                  placeholder="例如：校园二手交易平台"
                  className={inputClass}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-ink-muted">项目描述</label>
                  <button
                    type="button"
                    onClick={() => handleOptimize(index)}
                    disabled={optimizingIndex === index}
                    className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50"
                  >
                    {optimizingIndex === index ? (
                      <>
                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        AI优化中...
                      </>
                    ) : (
                      <>
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
                            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                          />
                        </svg>
                        AI 优化描述
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={project.description}
                  onChange={(e) => updateProject(index, 'description', e.target.value)}
                  placeholder="简单介绍这个项目做了什么"
                  rows={2}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted">技术栈</label>
                <input
                  type="text"
                  value={project.technology}
                  onChange={(e) => updateProject(index, 'technology', e.target.value)}
                  placeholder="例如：React, Node.js"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted">个人职责</label>
                <textarea
                  value={project.role}
                  onChange={(e) => updateProject(index, 'role', e.target.value)}
                  placeholder="你在这个项目中负责了什么"
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
