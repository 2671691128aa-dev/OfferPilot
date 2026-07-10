import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resumeFormSchema, type ResumeFormValues } from '../schemas/resumeSchema'
import { DEFAULT_FORM_DATA } from '../types/resume'
import { STORAGE_KEYS, removeStorageItem, saveResumeData } from '../utils/storage'
import { useFormPersist } from '../hooks/useFormPersist'
import StepProgress from '../components/StepProgress'

/** 步骤配置 */
const STEP_LABELS = ['基本信息', '教育经历', '技能信息', '项目经历', '目标岗位'] as const
const TOTAL_STEPS = STEP_LABELS.length
const STEP_DESCRIPTIONS = [
  '让我们先认识一下你',
  '你的教育背景将展示在简历中',
  '添加你掌握的技术和工具',
  '这是简历的核心部分',
  '告诉 AI 你想申请什么岗位',
]

/** 学历选项 */
const DEGREE_OPTIONS = ['本科', '硕士', '博士', '大专', '其他'] as const

/** 推荐岗位 */
const SUGGESTED_ROLES = [
  '前端开发实习',
  '后端开发实习',
  '全栈开发实习',
  'UI设计实习',
  '产品经理实习',
  '数据分析实习',
] as const

/** 输入框通用样式 */
const inputBase =
  'mt-1.5 w-full rounded-xl border bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-muted/50 transition focus:ring-2 focus:ring-primary/15 focus:outline-none'
const inputNormal = `${inputBase} border-border focus:border-primary`
const inputError = `${inputBase} border-red-500 focus:border-red-500 focus:ring-red-500/15`

/**
 * CreateResume 页面
 *
 * 使用 react-hook-form + Zod 管理 5 步表单状态，
 * 通过 useFormPersist 实现防抖 LocalStorage 持久化（500ms 延迟）。
 * 提交成功后清除草稿，保存数据到正式存储，跳转到 /resume。
 */
export default function CreateResume() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [skillInput, setSkillInput] = useState('')

  /** react-hook-form 实例，集成 Zod 校验 */
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues: DEFAULT_FORM_DATA,
    mode: 'onTouched',
  })

  /** 监听全部表单值，用于防抖持久化 */
  const watchedValues = watch()

  /** 防抖持久化：500ms 后写入 LocalStorage */
  useFormPersist(watchedValues, setValue, STORAGE_KEYS.FORM_DRAFT)

  /** 输入框样式：有错误时显示红色边框 */
  const inputClass = (fieldPath: string) =>
    getNestedError(errors, fieldPath) ? inputError : inputNormal

  /** 添加技能（自动去重，trim 后比较） */
  const addSkill = () => {
    const trimmed = skillInput.trim()
    const currentSkills = getValues('skills') || []
    if (trimmed && !currentSkills.includes(trimmed)) {
      setValue('skills', [...currentSkills, trimmed], { shouldDirty: true })
      setSkillInput('')
    }
  }

  /** 删除技能 */
  const removeSkill = (skill: string) => {
    const currentSkills = getValues('skills') || []
    setValue(
      'skills',
      currentSkills.filter((s) => s !== skill),
      { shouldDirty: true },
    )
  }

  /** 添加项目 */
  const addProject = () => {
    const currentProjects = getValues('projects') || []
    setValue('projects', [...currentProjects, { name: '', description: '', technology: '' }], {
      shouldDirty: true,
    })
  }

  /** 删除项目 */
  const removeProject = (index: number) => {
    const currentProjects = getValues('projects') || []
    setValue(
      'projects',
      currentProjects.filter((_, i) => i !== index),
      { shouldDirty: true },
    )
  }

  /** 上一步 */
  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  /** 下一步：先校验当前步骤的字段 */
  const handleNext = async () => {
    const fieldsToValidate = getStepFields(step)
    const isValid = await trigger(fieldsToValidate as Array<keyof ResumeFormValues>)
    if (isValid && step < TOTAL_STEPS) {
      setStep(step + 1)
    }
  }

  /** 最终提交：校验通过后保存数据并跳转 */
  const onSubmit = (data: ResumeFormValues) => {
    // 转换为兼容格式存储
    saveResumeData({
      profile: {
        name: data.profile.name,
        email: data.profile.email,
        location: data.profile.location || '',
      },
      education: {
        school: data.education.school,
        major: data.education.major || '',
        degree: data.education.degree || '',
        startDate: data.education.startDate || '',
        endDate: data.education.endDate || '',
      },
      skills: data.skills,
      projects: data.projects.map((p) => ({
        name: p.name,
        description: p.description || '',
        technology: p.technology || '',
        role: '',
      })),
      targetRole: data.targetRole,
    })

    // 清除草稿
    removeStorageItem(STORAGE_KEYS.FORM_DRAFT)

    navigate('/resume')
  }

  /** 获取当前步骤对应的表单字段路径 */
  const getStepFields = (currentStep: number): string[] => {
    switch (currentStep) {
      case 1:
        return ['profile.name', 'profile.email']
      case 2:
        return ['education.school']
      case 3:
        return ['skills']
      case 4:
        return ['projects']
      case 5:
        return ['targetRole']
      default:
        return []
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* 页面标题 */}
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">创建简历</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
          第 {step} 步：{STEP_LABELS[step - 1]}
        </h1>
        <p className="mt-2 text-ink-muted">{STEP_DESCRIPTIONS[step - 1]}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          {/* 左侧：步骤进度（桌面端） */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <StepProgress currentStep={step} steps={[...STEP_LABELS]} />
            </div>
          </div>

          {/* 右侧：表单内容 */}
          <div>
            {/* 移动端进度 */}
            <div className="mb-8 lg:hidden">
              <StepProgress currentStep={step} steps={[...STEP_LABELS]} />
            </div>

            {/* 表单卡片 */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-lg shadow-border/20 sm:p-8">
              {/* ─── Step 1: 基本信息 ─── */}
              {step === 1 && (
                <div className="space-y-5">
                  {/* 姓名 */}
                  <div>
                    <label
                      htmlFor="profile.name"
                      className="block text-sm font-medium text-ink-light"
                    >
                      姓名 <span className="ml-0.5 text-error">*</span>
                    </label>
                    <input
                      id="profile.name"
                      type="text"
                      placeholder="张三"
                      className={inputClass('profile.name')}
                      {...register('profile.name')}
                    />
                    {getNestedError(errors, 'profile.name') && (
                      <p className="mt-1 text-xs text-error">
                        {getNestedError(errors, 'profile.name')?.message}
                      </p>
                    )}
                  </div>

                  {/* 邮箱 */}
                  <div>
                    <label
                      htmlFor="profile.email"
                      className="block text-sm font-medium text-ink-light"
                    >
                      邮箱 <span className="ml-0.5 text-error">*</span>
                    </label>
                    <input
                      id="profile.email"
                      type="email"
                      placeholder="example@email.com"
                      className={inputClass('profile.email')}
                      {...register('profile.email')}
                    />
                    {getNestedError(errors, 'profile.email') && (
                      <p className="mt-1 text-xs text-error">
                        {getNestedError(errors, 'profile.email')?.message}
                      </p>
                    )}
                  </div>

                  {/* 所在城市 */}
                  <div>
                    <label
                      htmlFor="profile.location"
                      className="block text-sm font-medium text-ink-light"
                    >
                      所在城市
                    </label>
                    <input
                      id="profile.location"
                      type="text"
                      placeholder="北京"
                      className={inputNormal}
                      {...register('profile.location')}
                    />
                  </div>
                </div>
              )}

              {/* ─── Step 2: 教育经历 ─── */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* 学校 */}
                  <div>
                    <label
                      htmlFor="education.school"
                      className="block text-sm font-medium text-ink-light"
                    >
                      学校名称 <span className="ml-0.5 text-error">*</span>
                    </label>
                    <input
                      id="education.school"
                      type="text"
                      placeholder="XX大学"
                      className={inputClass('education.school')}
                      {...register('education.school')}
                    />
                    {getNestedError(errors, 'education.school') && (
                      <p className="mt-1 text-xs text-error">
                        {getNestedError(errors, 'education.school')?.message}
                      </p>
                    )}
                  </div>

                  {/* 专业 */}
                  <div>
                    <label
                      htmlFor="education.major"
                      className="block text-sm font-medium text-ink-light"
                    >
                      专业
                    </label>
                    <input
                      id="education.major"
                      type="text"
                      placeholder="计算机科学与技术"
                      className={inputNormal}
                      {...register('education.major')}
                    />
                  </div>

                  {/* 学历 */}
                  <div>
                    <label className="block text-sm font-medium text-ink-light">学历</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {DEGREE_OPTIONS.map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => setValue('education.degree', deg, { shouldDirty: true })}
                          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                            watchedValues.education.degree === deg
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-ink-muted hover:border-primary/30 hover:text-ink'
                          }`}
                        >
                          {deg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 时间 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="education.startDate"
                        className="block text-sm font-medium text-ink-light"
                      >
                        入学时间
                      </label>
                      <input
                        id="education.startDate"
                        type="text"
                        placeholder="2022-09"
                        className={inputNormal}
                        {...register('education.startDate')}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="education.endDate"
                        className="block text-sm font-medium text-ink-light"
                      >
                        毕业时间
                      </label>
                      <input
                        id="education.endDate"
                        type="text"
                        placeholder="2026-06"
                        className={inputNormal}
                        {...register('education.endDate')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Step 3: 技能信息 ─── */}
              {step === 3 && (
                <div>
                  <label className="block text-sm font-medium text-ink-light">技能</label>
                  <p className="mt-1 text-xs text-ink-muted">输入技能后按 Enter 或点击添加</p>

                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill()
                        }
                      }}
                      placeholder="例如：React、TypeScript、Git"
                      className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-muted/50 transition focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
                    >
                      添加
                    </button>
                  </div>

                  {(watchedValues.skills?.length ?? 0) > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(watchedValues.skills || []).map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3.5 py-1.5 text-sm font-medium text-primary"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="rounded-full p-0.5 text-primary/50 transition hover:bg-primary/10 hover:text-primary"
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
                  )}
                </div>
              )}

              {/* ─── Step 4: 项目经历 ─── */}
              {step === 4 && (
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                      添加项目
                    </button>
                  </div>

                  {(watchedValues.projects?.length ?? 0) === 0 && (
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
                    {(watchedValues.projects || []).map((project, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-border bg-surface-warm/50 p-5"
                      >
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
                          {/* 项目名称 */}
                          <div>
                            <label className="block text-xs font-medium text-ink-muted">
                              项目名称 <span className="text-error">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="例如：校园二手交易平台"
                              className={
                                getNestedError(errors, `projects.${index}.name`)
                                  ? inputError
                                  : inputNormal
                              }
                              value={project.name}
                              onChange={(e) =>
                                setValue(`projects.${index}.name`, e.target.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            />
                            {getNestedError(errors, `projects.${index}.name`) && (
                              <p className="mt-1 text-xs text-error">
                                {getNestedError(errors, `projects.${index}.name`)?.message}
                              </p>
                            )}
                          </div>
                          {/* 项目描述 */}
                          <div>
                            <label className="block text-xs font-medium text-ink-muted">
                              项目描述
                            </label>
                            <textarea
                              placeholder="简单介绍这个项目做了什么"
                              rows={2}
                              className={inputNormal}
                              value={project.description}
                              onChange={(e) =>
                                setValue(`projects.${index}.description`, e.target.value, {
                                  shouldDirty: true,
                                })
                              }
                            />
                          </div>
                          {/* 技术栈 */}
                          <div>
                            <label className="block text-xs font-medium text-ink-muted">
                              技术栈
                            </label>
                            <input
                              type="text"
                              placeholder="例如：React, Node.js"
                              className={inputNormal}
                              value={project.technology}
                              onChange={(e) =>
                                setValue(`projects.${index}.technology`, e.target.value, {
                                  shouldDirty: true,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Step 5: 目标岗位 ─── */}
              {step === 5 && (
                <div className="space-y-6">
                  {/* 推荐岗位 */}
                  <div>
                    <label className="block text-sm font-medium text-ink-light">
                      选择岗位 <span className="ml-0.5 text-error">*</span>
                    </label>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {SUGGESTED_ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() =>
                            setValue('targetRole', role, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                            watchedValues.targetRole === role
                              ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                              : 'border-border text-ink-muted hover:border-primary/30 hover:text-ink'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                    {getNestedError(errors, 'targetRole') && (
                      <p className="mt-2 text-xs text-error">
                        {getNestedError(errors, 'targetRole')?.message}
                      </p>
                    )}
                  </div>

                  {/* 自定义岗位 */}
                  <div className="relative">
                    <div className="absolute inset-x-0 -top-3 flex items-center gap-3">
                      <div className="flex-1 border-t border-border" />
                      <span className="text-xs text-ink-muted">或</span>
                      <div className="flex-1 border-t border-border" />
                    </div>
                    <div className="pt-3">
                      <div>
                        <label
                          htmlFor="targetRole"
                          className="block text-sm font-medium text-ink-light"
                        >
                          自定义岗位
                        </label>
                        <input
                          id="targetRole"
                          type="text"
                          placeholder="输入目标岗位名称"
                          className={inputNormal}
                          value={watchedValues.targetRole || ''}
                          onChange={(e) =>
                            setValue('targetRole', e.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 导航按钮 */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={step === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-ink-muted transition hover:bg-card disabled:cursor-not-allowed disabled:opacity-30 sm:w-auto max-sm:w-full max-sm:justify-center"
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
                  className="btn-shine inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark sm:w-auto max-sm:w-full max-sm:justify-center"
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
                  type="submit"
                  className="btn-shine inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark sm:w-auto max-sm:w-full max-sm:justify-center"
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
      </form>
    </div>
  )
}

// ─── 工具函数 ───

/**
 * 从 react-hook-form 的 errors 对象中按路径获取嵌套错误信息
 * 支持 "profile.name"、"projects.0.name" 这样的点分隔路径
 *
 * @param errors - formState.errors 对象
 * @param path - 字段路径
 * @returns 错误对象（含 message），或 undefined
 */
function getNestedError(
  errors: Record<string, unknown>,
  path: string,
): { message?: string } | undefined {
  const parts = path.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = errors

  for (const part of parts) {
    if (current == null) return undefined
    if (Array.isArray(current)) {
      current = current[parseInt(part, 10)]
    } else {
      current = current[part]
    }
  }

  return current?.message ? { message: current.message as string } : undefined
}
