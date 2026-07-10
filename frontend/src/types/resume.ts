/**
 * 简历表单数据类型定义
 * 用于 CreateResume 4 步表单 + Zod Schema 校验 + LocalStorage 持久化
 */

/** 用户基本信息 */
export interface IResumeFormData {
  profile: {
    /** 姓名（必填） */
    name: string
    /** 邮箱（必填，邮箱格式） */
    email: string
    /** 所在城市 */
    location: string
  }
  education: {
    /** 学校名称（必填） */
    school: string
    /** 专业 */
    major: string
    /** 学历：本科 / 硕士 / 博士 / 大专 / 其他 */
    degree: string
    /** 入学时间，如 "2022-09" */
    startDate: string
    /** 毕业时间，如 "2026-06" */
    endDate: string
  }
  /** 技能列表 */
  skills: string[]
  /** 项目经历列表 */
  projects: IProjectItem[]
  /** 目标岗位（必填） */
  targetRole: string
}

/** 单个项目经历 */
export interface IProjectItem {
  /** 项目名称（必填） */
  name: string
  /** 项目描述 */
  description: string
  /** 技术栈（逗号分隔的字符串） */
  technology: string
}

/** 表单默认值 */
export const DEFAULT_FORM_DATA: IResumeFormData = {
  profile: { name: '', email: '', location: '' },
  education: { school: '', major: '', degree: '', startDate: '', endDate: '' },
  skills: [],
  projects: [],
  targetRole: '',
}
