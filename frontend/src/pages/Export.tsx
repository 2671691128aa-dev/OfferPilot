import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  loadResumeData,
  loadVersions,
  saveTemplate,
  loadTemplate,
  type ResumeFormData,
  type TemplateType,
  type ResumeVersion,
} from '../utils/storage'

type Template = TemplateType

const templates: { key: Template; name: string; description: string; icon: string }[] = [
  {
    key: 'developer',
    name: '程序员简洁版',
    description: '黑白技术风格，适合开发岗位',
    icon: '⌨️',
  },
  {
    key: 'student',
    name: '学生实习版',
    description: '简洁突出项目，适合校招',
    icon: '🎓',
  },
]

/** Escape HTML special characters to prevent XSS and broken rendering. */
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Merge AI-generated data on top of the raw form data. */
function mergeResumeData(
  formData: ResumeFormData,
  aiData: ResumeVersion['data'] | null,
): ResumeFormData & { aiSummary?: string } {
  if (!aiData) return formData

  const mergedProjects = formData.projects.map((fp) => {
    const aiProject = aiData.projects.find(
      (ap) => ap.title === fp.name || ap.title.toLowerCase() === fp.name.toLowerCase(),
    )
    return {
      ...fp,
      description: aiProject?.description || fp.description,
    }
  })

  return {
    ...formData,
    skills: aiData.skills.length > 0 ? aiData.skills : formData.skills,
    projects: mergedProjects,
    aiSummary: aiData.summary,
  }
}

function buildPrintHTML(data: ResumeFormData & { aiSummary?: string }, template: Template): string {
  const { profile, education: edu, skills, projects, targetRole, aiSummary } = data

  const header =
    template === 'developer'
      ? `<div style="border-bottom:2px solid #111;padding-bottom:12px">
        <h1 style="font-size:24px;font-weight:700;margin:0">${esc(profile.name)}</h1>
        <div style="margin-top:6px;font-size:12px;color:#666;display:flex;gap:12px;flex-wrap:wrap">
          ${profile.email ? `<span>${esc(profile.email)}</span>` : ''}
          ${edu?.school ? `<span>${esc(edu.school)}</span>` : ''}
          ${profile.location ? `<span>${esc(profile.location)}</span>` : ''}
        </div>
        ${targetRole ? `<div style="margin-top:6px;font-size:12px;color:#888">目标岗位：${esc(targetRole)}</div>` : ''}
      </div>`
      : `<div style="border-bottom:2px solid #2563eb;padding-bottom:12px">
        <h1 style="font-size:24px;font-weight:700;margin:0">${esc(profile.name)}</h1>
        <div style="margin-top:6px;font-size:12px;color:#888;display:flex;gap:12px;flex-wrap:wrap">
          ${profile.email ? `<span>${esc(profile.email)}</span>` : ''}
          ${edu?.school ? `<span>${esc(edu.school)}</span>` : ''}
          ${profile.location ? `<span>${esc(profile.location)}</span>` : ''}
        </div>
        ${targetRole ? `<div style="margin-top:6px;font-size:12px;color:#2563eb;font-weight:500">求职意向：${esc(targetRole)}</div>` : ''}
      </div>`

  const sectionTitle = (text: string, color: string) =>
    `<h2 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${color};border-bottom:1px solid #e5e5e5;padding-bottom:4px;margin-top:20px">${esc(text)}</h2>`

  const summarySection = aiSummary
    ? `${sectionTitle('个人简介', template === 'developer' ? '#888' : '#2563eb')}
       <p style="margin-top:8px;font-size:13px;color:#333;line-height:1.6">${esc(aiSummary)}</p>`
    : ''

  const educationSection =
    edu?.school || edu?.degree
      ? template === 'student'
        ? `${sectionTitle('教育背景', '#2563eb')}
         <div style="margin-top:8px;background:#eff6ff;border-radius:6px;padding:10px">
           <div style="font-size:14px;font-weight:500">${[edu?.degree, edu?.school, edu?.major].filter(Boolean).map(esc).join(' · ')}</div>
           ${edu.startDate || edu.endDate ? `<div style="font-size:12px;color:#888;margin-top:2px">${esc(edu.startDate || '?')} ~ ${esc(edu.endDate || '?')}</div>` : ''}
         </div>`
        : ''
      : ''

  const skillsSection =
    skills.length > 0
      ? template === 'developer'
        ? `${sectionTitle('技能', '#888')}
         <p style="margin-top:8px;font-size:14px;color:#333">${skills.map(esc).join(' · ')}</p>`
        : `${sectionTitle('技能', '#2563eb')}
         <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">
           ${skills.map((s) => `<span style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:999px;padding:2px 10px;font-size:12px;color:#1d4ed8">${esc(s)}</span>`).join('')}
         </div>`
      : ''

  const projectsSection =
    projects.length > 0
      ? `${sectionTitle('项目经历', template === 'developer' ? '#888' : '#2563eb')}
       <div style="margin-top:10px">
         ${projects
           .map((p) =>
             template === 'developer'
               ? `<div style="margin-bottom:14px">
                  <div style="display:flex;justify-content:space-between;align-items:baseline">
                    <h3 style="font-size:14px;font-weight:600;margin:0">${esc(p.name)}</h3>
                    ${p.technology ? `<span style="font-size:12px;color:#888">${esc(p.technology)}</span>` : ''}
                  </div>
                  ${p.description ? `<p style="margin-top:4px;font-size:13px;color:#555">${esc(p.description)}</p>` : ''}
                  ${p.role ? `<p style="margin-top:2px;font-size:13px;color:#555"><strong>职责：</strong>${esc(p.role)}</p>` : ''}
                </div>`
               : `<div style="margin-bottom:14px;border:1px solid #f3f4f6;border-radius:6px;padding:10px">
                  <div style="display:flex;justify-content:space-between;align-items:baseline">
                    <h3 style="font-size:14px;font-weight:600;margin:0">${esc(p.name)}</h3>
                    ${p.technology ? `<span style="font-size:12px;color:#9ca3af">${esc(p.technology)}</span>` : ''}
                  </div>
                  ${p.description ? `<p style="margin-top:4px;font-size:13px;color:#555">${esc(p.description)}</p>` : ''}
                  ${p.role ? `<p style="margin-top:2px;font-size:13px;color:#555"><strong style="color:#374151">个人职责：</strong>${esc(p.role)}</p>` : ''}
                </div>`,
           )
           .join('')}
       </div>`
      : ''

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${esc(profile.name)} - 简历</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; padding: 40px; color: #111; }
  @media print {
    body { padding: 20px; }
    @page { size: A4; margin: 15mm; }
  }
</style>
</head>
<body>
  ${header}
  ${summarySection}
  ${educationSection}
  ${skillsSection}
  ${projectsSection}
</body>
</html>`
}

export default function Export() {
  const [selectedTemplate, setSelectedTemplateRaw] = useState<Template>(loadTemplate)

  const setSelectedTemplate = (tpl: Template) => {
    setSelectedTemplateRaw(tpl)
    saveTemplate(tpl)
  }
  const formData = loadResumeData()
  const versions = loadVersions()
  const latestAI = versions.length > 0 ? versions[0].data : null
  const mergedData = mergeResumeData(formData, latestAI)
  const hasProfile = formData.profile.name.trim() !== ''

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
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-xl font-bold text-ink">还没有简历数据</h2>
        <p className="mt-2 text-sm text-ink-muted">请先填写个人信息后再导出 PDF。</p>
        <Link
          to="/create"
          className="btn-shine mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          去填写信息
        </Link>
      </div>
    )
  }

  const handleDownload = () => {
    const html = buildPrintHTML(mergedData, selectedTemplate)
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('无法打开打印窗口，请检查浏览器是否阻止了弹窗。')
      return
    }
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 200)
  }

  const hasAIData = latestAI !== null

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* 页面标题 */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">PDF 导出</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">导出简历</h1>
        <p className="mt-2 text-ink-muted">选择模板，预览简历效果，确认无误后下载 PDF。</p>
      </div>

      {!hasAIData && (
        <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 px-5 py-3.5 text-sm text-warning">
          <span className="font-medium">提示：</span>
          未检测到 AI 生成的简历数据，当前仅使用原始填写信息。建议先前往{' '}
          <Link to="/resume" className="font-semibold underline">
            AI 简历预览
          </Link>{' '}
          生成优化后的简历。
        </div>
      )}

      {/* 模板选择 */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-ink">选择模板</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {templates.map((tpl) => (
            <button
              key={tpl.key}
              onClick={() => setSelectedTemplate(tpl.key)}
              className={`card-hover-lift group rounded-2xl border-2 p-6 text-left transition-all duration-200 ${
                selectedTemplate === tpl.key
                  ? 'border-primary bg-primary/[0.03] shadow-lg shadow-primary/10'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl">{tpl.icon}</span>
                <div>
                  <p className="font-bold text-ink">{tpl.name}</p>
                  <p className="mt-1 text-sm text-ink-muted">{tpl.description}</p>
                </div>
              </div>
              {selectedTemplate === tpl.key && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  已选择
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 简历预览 */}
      <div className="mt-10">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-ink">简历预览</h2>
          {hasAIData && (
            <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
              含 AI 优化
            </span>
          )}
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-border/20">
          {selectedTemplate === 'developer' ? (
            <ResumePreviewDeveloper data={mergedData} />
          ) : (
            <ResumePreviewStudent data={mergedData} />
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="mt-10 flex items-center justify-between">
        <Link
          to="/resume"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-ink-muted transition hover:bg-card"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          返回简历预览
        </Link>
        <button
          onClick={handleDownload}
          className="btn-shine inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          下载 PDF
        </button>
      </div>
    </div>
  )
}

/* ─── Preview Components ─── */

function ResumePreviewDeveloper({ data }: { data: ResumeFormData & { aiSummary?: string } }) {
  return (
    <div className="bg-card p-10 text-sm text-ink" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="border-b-2 border-ink pb-3">
        <h1 className="text-2xl font-bold">{data.profile.name}</h1>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-muted">
          {data.profile.email && <span>{data.profile.email}</span>}
          {data.education?.school && <span>{data.education.school}</span>}
          {data.profile.location && <span>{data.profile.location}</span>}
        </div>
        {data.targetRole && (
          <p className="mt-1 text-xs font-medium text-ink-muted">目标岗位：{data.targetRole}</p>
        )}
      </div>
      {data.aiSummary && (
        <div className="mt-5">
          <h2 className="border-b border-border pb-1 text-xs font-bold uppercase tracking-wider text-ink-muted">
            个人简介
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-light">{data.aiSummary}</p>
        </div>
      )}
      {data.skills.length > 0 && (
        <div className="mt-5">
          <h2 className="border-b border-border pb-1 text-xs font-bold uppercase tracking-wider text-ink-muted">
            技能
          </h2>
          <p className="mt-2 text-sm text-ink-light">{data.skills.join(' · ')}</p>
        </div>
      )}
      {data.projects.length > 0 && (
        <div className="mt-5">
          <h2 className="border-b border-border pb-1 text-xs font-bold uppercase tracking-wider text-ink-muted">
            项目经历
          </h2>
          <div className="mt-3 space-y-4">
            {data.projects.map((project, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-ink">{project.name}</h3>
                  {project.technology && (
                    <span className="text-xs text-ink-muted">{project.technology}</span>
                  )}
                </div>
                {project.description && (
                  <p className="mt-1 text-sm text-ink-light">{project.description}</p>
                )}
                {project.role && (
                  <p className="mt-0.5 text-sm text-ink-light">
                    <span className="font-medium">职责：</span>
                    {project.role}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ResumePreviewStudent({ data }: { data: ResumeFormData & { aiSummary?: string } }) {
  return (
    <div className="bg-card p-10 text-sm text-ink" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="border-b-2 border-primary pb-3">
        <h1 className="text-2xl font-bold text-ink">{data.profile.name}</h1>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-muted">
          {data.profile.email && <span>{data.profile.email}</span>}
          {data.education?.school && <span>{data.education.school}</span>}
          {data.profile.location && <span>{data.profile.location}</span>}
        </div>
        {data.targetRole && (
          <p className="mt-2 text-xs font-medium text-primary">求职意向：{data.targetRole}</p>
        )}
      </div>
      {data.aiSummary && (
        <div className="mt-5">
          <h2 className="text-sm font-bold text-primary">个人简介</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-light">{data.aiSummary}</p>
        </div>
      )}
      {(data.education?.school || data.education?.major) && (
        <div className="mt-5">
          <h2 className="text-sm font-bold text-primary">教育背景</h2>
          <div className="mt-2 rounded-lg bg-primary/[0.04] p-3">
            <p className="text-sm font-medium text-ink">
              {[data.education.degree, data.education.school, data.education.major]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
      )}
      {data.skills.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-bold text-primary">技能</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-primary/20 bg-primary/[0.04] px-2.5 py-0.5 text-xs text-primary"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      {data.projects.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-bold text-primary">项目经历</h2>
          <div className="mt-3 space-y-4">
            {data.projects.map((project, i) => (
              <div key={i} className="rounded-lg border border-border-light p-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-ink">{project.name}</h3>
                  {project.technology && (
                    <span className="text-xs text-ink-muted">{project.technology}</span>
                  )}
                </div>
                {project.description && (
                  <p className="mt-1 text-sm text-ink-light">{project.description}</p>
                )}
                {project.role && (
                  <p className="mt-0.5 text-sm text-ink-light">
                    <span className="font-medium text-ink">个人职责：</span>
                    {project.role}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
