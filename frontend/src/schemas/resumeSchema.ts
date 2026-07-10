import { z } from 'zod'

/**
 * 简历表单 Zod 校验 Schema
 * 配合 @hookform/resolvers/zod 集成到 react-hook-form
 */

/** 单个项目经历校验 */
export const projectItemSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  description: z.string(),
  technology: z.string(),
})

/** 完整表单校验 */
export const resumeFormSchema = z.object({
  profile: z.object({
    name: z.string().min(1, '请输入姓名'),
    email: z.string().min(1, '请输入邮箱').email('请输入有效的邮箱地址'),
    location: z.string(),
  }),
  education: z.object({
    school: z.string().min(1, '请输入学校名称'),
    major: z.string(),
    degree: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }),
  skills: z.array(z.string()),
  projects: z.array(projectItemSchema),
  targetRole: z.string().min(1, '请选择或输入目标岗位'),
})

/** 表单数据推断类型 */
export type ResumeFormValues = z.infer<typeof resumeFormSchema>
