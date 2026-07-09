import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  loadResumeData,
  saveTemplate,
  loadTemplate,
  type ResumeFormData,
  type TemplateType,
} from '../utils/storage'

type Template = TemplateType

const templates: { key: Template; name: string; description: string }[] = [
  {
    key: 'developer',
    name: '程序员简洁版',
    description: '黑白技术风格，适合开发岗位',
  },
  {
    key: 'student',
    name: '学生实习版',
    description: '简洁突出项目，适合校招',
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

function buildPrintHTML(data: ResumeFormData, template: Template): string {
  const { profile, education: edu, skills, projects, targetRole } = data

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
  const data = loadResumeData()
  const hasProfile = data.profile.name.trim() !== ''

  if (!hasProfile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-8 w-8 text-gray-400"
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
        <h2 className="mt-6 text-xl font-semibold text-gray-900">还没有简历数据</h2>
        <p className="mt-2 text-gray-600">请先填写个人信息后再导出 PDF。</p>
        <Link
          to="/create"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          去填写信息
        </Link>
      </div>
    )
  }

  const handleDownload = () => {
    const html = buildPrintHTML(data, selectedTemplate)
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('无法打开打印窗口，请检查浏览器是否阻止了弹窗。')
      return
    }
    printWindow.document.write(html)
    printWindow.document.close()
    // wait for styles to apply, then trigger print
    setTimeout(() => {
      printWindow.print()
    }, 200)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900">PDF 导出</h1>
      <p className="mt-2 text-sm text-gray-600">选择模板，预览简历效果，确认无误后下载 PDF。</p>

      {/* Template Selector */}
      <div className="mt-8">
        <h2 className="text-sm font-medium text-gray-700">选择模板</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {templates.map((tpl) => (
            <button
              key={tpl.key}
              onClick={() => setSelectedTemplate(tpl.key)}
              className={`rounded-xl border-2 p-5 text-left transition ${
                selectedTemplate === tpl.key
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-gray-900">{tpl.name}</p>
              <p className="mt-1 text-sm text-gray-500">{tpl.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="mt-8">
        <h2 className="text-sm font-medium text-gray-700">简历预览</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {selectedTemplate === 'developer' ? (
            <ResumePreviewDeveloper data={data} />
          ) : (
            <ResumePreviewStudent data={data} />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between">
        <Link to="/resume" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← 返回简历预览
        </Link>
        <button
          onClick={handleDownload}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
        >
          下载 PDF
        </button>
      </div>
    </div>
  )
}

/* ─── Preview Components ─── */

function ResumePreviewDeveloper({ data }: { data: ResumeFormData }) {
  return (
    <div
      className="bg-white p-10 font-sans text-sm text-gray-900"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      <div className="border-b-2 border-gray-900 pb-3">
        <h1 className="text-2xl font-bold">{data.profile.name}</h1>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-600">
          {data.profile.email && <span>{data.profile.email}</span>}
          {data.education?.school && <span>{data.education.school}</span>}
          {data.profile.location && <span>{data.profile.location}</span>}
        </div>
        {data.targetRole && (
          <p className="mt-1 text-xs font-medium text-gray-500">目标岗位：{data.targetRole}</p>
        )}
      </div>
      {data.skills.length > 0 && (
        <div className="mt-5">
          <h2 className="border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-wider text-gray-500">
            技能
          </h2>
          <p className="mt-2 text-sm text-gray-700">{data.skills.join(' · ')}</p>
        </div>
      )}
      {data.projects.length > 0 && (
        <div className="mt-5">
          <h2 className="border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-wider text-gray-500">
            项目经历
          </h2>
          <div className="mt-3 space-y-4">
            {data.projects.map((project, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  {project.technology && (
                    <span className="text-xs text-gray-500">{project.technology}</span>
                  )}
                </div>
                {project.description && (
                  <p className="mt-1 text-sm text-gray-600">{project.description}</p>
                )}
                {project.role && (
                  <p className="mt-0.5 text-sm text-gray-600">
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

function ResumePreviewStudent({ data }: { data: ResumeFormData }) {
  return (
    <div
      className="bg-white p-10 font-sans text-sm text-gray-900"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      <div className="border-b-2 border-blue-600 pb-3">
        <h1 className="text-2xl font-bold text-gray-900">{data.profile.name}</h1>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
          {data.profile.email && <span>{data.profile.email}</span>}
          {data.education?.school && <span>{data.education.school}</span>}
          {data.profile.location && <span>{data.profile.location}</span>}
        </div>
        {data.targetRole && (
          <p className="mt-2 text-xs font-medium text-blue-600">求职意向：{data.targetRole}</p>
        )}
      </div>
      {(data.education?.school || data.education?.major) && (
        <div className="mt-5">
          <h2 className="text-sm font-bold text-blue-600">教育背景</h2>
          <div className="mt-2 rounded-lg bg-blue-50 p-3">
            <p className="text-sm font-medium text-gray-900">
              {[data.education.degree, data.education.school, data.education.major]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
      )}
      {data.skills.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-bold text-blue-600">技能</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      {data.projects.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-bold text-blue-600">项目经历</h2>
          <div className="mt-3 space-y-4">
            {data.projects.map((project, i) => (
              <div key={i} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  {project.technology && (
                    <span className="text-xs text-gray-400">{project.technology}</span>
                  )}
                </div>
                {project.description && (
                  <p className="mt-1 text-sm text-gray-600">{project.description}</p>
                )}
                {project.role && (
                  <p className="mt-0.5 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">个人职责：</span>
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
