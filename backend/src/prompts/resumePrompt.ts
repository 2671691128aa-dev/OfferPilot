export interface ResumeInput {
  name: string
  email: string
  location: string
  education: {
    school: string
    major: string
    degree: string
    startDate: string
    endDate: string
  }
  skills: string[]
  projects: Array<{
    name: string
    description: string
    technology: string
    role: string
  }>
  targetRole: string
}

const SYSTEM_PROMPT = `你是一名拥有多年互联网招聘经验的技术招聘专家。
你的任务是帮助大学生生成一份适合互联网实习岗位的专业简历。

你必须严格遵守以下规则：
1. 绝对不虚构用户没有提供的经历。
2. 优先突出技术能力。
3. 优化项目描述表达，使用专业术语。
4. 使用企业招聘语言，避免口语化表达。
5. 突出个人贡献，避免模糊的"参与"描述。
6. 根据目标岗位调整关键词和内容重点。

你必须以 JSON 格式输出，不要包含任何其他文字。`

export function buildResumePrompt(data: ResumeInput): { system: string; user: string } {
  const edu = data.education
  const userInfo = `
姓名：${data.name}
邮箱：${data.email || '未填写'}
所在城市：${data.location || '未填写'}
目标岗位：${data.targetRole || '未指定'}

教育经历：
  学校：${edu?.school || '未填写'}
  专业：${edu?.major || '未填写'}
  学历：${edu?.degree || '未填写'}
  时间：${edu?.startDate || '?'} ~ ${edu?.endDate || '?'}

技能：${data.skills.length > 0 ? data.skills.join('、') : '未填写'}

项目经历：
${
  data.projects.length > 0
    ? data.projects
        .map(
          (p, i) => `
项目${i + 1}：${p.name}
描述：${p.description || '未填写'}
技术栈：${p.technology || '未填写'}
个人职责：${p.role || '未填写'}
`,
        )
        .join('\n')
    : '未填写'
}`

  const outputFormat = `
请严格按以下顺序输出 JSON 字段（先输出 summary，再输出 skills，再输出 projects，最后输出 advice），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "summary": "个人简介，1-3句话，突出技术能力和目标",
  "skills": ["优化后的技能描述数组"],
  "projects": [
    {
      "title": "项目名称",
      "description": "优化后的项目描述，包含技术栈、功能和成果",
      "technology": ["技术栈数组"]
    }
  ],
  "advice": ["针对该简历的具体优化建议数组，每条一句话"]
}`

  return {
    system: SYSTEM_PROMPT,
    user: `请根据以下用户信息生成专业简历：\n${userInfo}\n\n${outputFormat}`,
  }
}
