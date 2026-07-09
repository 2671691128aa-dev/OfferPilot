import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepProgress from '../components/StepProgress'
import FormInput from '../components/FormInput'
import SkillInput from '../components/SkillInput'
import ProjectForm, { type ProjectData } from '../components/ProjectForm'
import { type ResumeFormData, loadResumeData, saveResumeData } from '../utils/storage'

const STEP_LABELS = ['基本信息', '教育经历', '技能信息', '项目经历', '目标岗位']
const TOTAL_STEPS = STEP_LABELS.length
const STEP_DESCRIPTIONS = [
  '让我们先认识一下你',
  '你的教育背景将展示在简历中',
  '添加你掌握的技术和工具',
  '这是简历的核心部分',
  '告诉 AI 你想申请什么岗位',
]

export default function CreateResume() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<ResumeFormData>(loadResumeData)

  const updateProfile = (field: keyof ResumeFormData['profile'], value: string) => {
    setFormData((prev) => ({ ...prev, profile: { ...prev.profile, [field]: value } }))
  }
  const updateEducation = (field: keyof ResumeFormData['education'], value: string) => {
    setFormData((prev) => ({ ...prev, education: { ...prev.education, [field]: value } }))
  }
  const updateSkills = (skills: string[]) => {
    setFormData((prev) => ({ ...prev, skills }))
  }
  const updateProjects = (projects: ProjectData[]) => {
    setFormData((prev) => ({ ...prev, projects }))
  }
  const updateTargetRole = (targetRole: string) => {
    setFormData((prev) => ({ ...prev, targetRole }))
  }

  const canGoNext = (): boolean => {
    if (step === 1) return formData.profile.name.trim() !== ''
    if (step === 2) return formData.education.school.trim() !== ''
    if (step === 3) return formData.skills.length > 0
    if (step === 4)
      return formData.projects.length > 0 && formData.projects.every((p) => p.name.trim() !== '')
    return true
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      saveResumeData(formData)
      setStep(step + 1)
    }
  }
  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }
  const handleSubmit = () => {
    saveResumeData(formData)
    navigate('/resume')
  }

  const degreeOptions = ['本科', '硕士', '博士', '大专', '其他']
  const suggestedRoles = [
    '前端开发实习',
    '后端开发实习',
    '全栈开发实习',
    'UI设计实习',
    '产品经理实习',
    '数据分析实习',
  ]

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">创建简历</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
          第 {step} 步：{STEP_LABELS[step - 1]}
        </h1>
        <p className="mt-2 text-ink-muted">{STEP_DESCRIPTIONS[step - 1]}</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        {/* Left: Progress sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <StepProgress currentStep={step} steps={STEP_LABELS} />
          </div>
        </div>

        {/* Right: Form content */}
        <div>
          {/* Mobile progress */}
          <div className="mb-8 lg:hidden">
            <StepProgress currentStep={step} steps={STEP_LABELS} />
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {/* Step 1: 基本信息 */}
            {step === 1 && (
              <div className="space-y-5">
                <FormInput
                  label="姓名"
                  name="name"
                  value={formData.profile.name}
                  onChange={(v) => updateProfile('name', v)}
                  placeholder="张三"
                  required
                />
                <FormInput
                  label="邮箱"
                  name="email"
                  value={formData.profile.email}
                  onChange={(v) => updateProfile('email', v)}
                  placeholder="example@email.com"
                  type="email"
                />
                <FormInput
                  label="所在城市"
                  name="location"
                  value={formData.profile.location}
                  onChange={(v) => updateProfile('location', v)}
                  placeholder="北京"
                />
              </div>
            )}

            {/* Step 2: 教育经历 */}
            {step === 2 && (
              <div className="space-y-5">
                <FormInput
                  label="学校名称"
                  name="eduSchool"
                  value={formData.education.school}
                  onChange={(v) => updateEducation('school', v)}
                  placeholder="XX大学"
                  required
                />
                <FormInput
                  label="专业"
                  name="eduMajor"
                  value={formData.education.major}
                  onChange={(v) => updateEducation('major', v)}
                  placeholder="计算机科学与技术"
                />
                <div>
                  <label className="block text-sm font-medium text-ink-light">学历</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {degreeOptions.map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => updateEducation('degree', deg)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          formData.education.degree === deg
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-ink-muted hover:border-primary/30 hover:text-ink'
                        }`}
                      >
                        {deg}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="入学时间"
                    name="eduStart"
                    value={formData.education.startDate}
                    onChange={(v) => updateEducation('startDate', v)}
                    placeholder="2022-09"
                  />
                  <FormInput
                    label="毕业时间"
                    name="eduEnd"
                    value={formData.education.endDate}
                    onChange={(v) => updateEducation('endDate', v)}
                    placeholder="2026-06"
                  />
                </div>
              </div>
            )}

            {/* Step 3: 技能信息 */}
            {step === 3 && (
              <div>
                <SkillInput skills={formData.skills} onChange={updateSkills} />
              </div>
            )}

            {/* Step 4: 项目经历 */}
            {step === 4 && (
              <div>
                <ProjectForm projects={formData.projects} onChange={updateProjects} />
              </div>
            )}

            {/* Step 5: 目标岗位 */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-ink-light">选择岗位</label>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {suggestedRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => updateTargetRole(role)}
                        className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                          formData.targetRole === role
                            ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                            : 'border-border text-ink-muted hover:border-primary/30 hover:text-ink'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-x-0 -top-3 flex items-center gap-3">
                    <div className="flex-1 border-t border-border" />
                    <span className="text-xs text-ink-muted">或</span>
                    <div className="flex-1 border-t border-border" />
                  </div>
                  <div className="pt-3">
                    <FormInput
                      label="自定义岗位"
                      name="targetRole"
                      value={formData.targetRole}
                      onChange={updateTargetRole}
                      placeholder="输入目标岗位名称"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 1}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-ink-muted transition hover:bg-card disabled:cursor-not-allowed disabled:opacity-30"
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
              上一步
            </button>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext()}
                className="btn-shine inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-30"
              >
                下一步
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
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-shine inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark"
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
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                  />
                </svg>
                生成 AI 简历
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
