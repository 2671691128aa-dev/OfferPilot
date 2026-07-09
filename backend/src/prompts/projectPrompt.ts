const SYSTEM_PROMPT = `你是一名资深技术招聘专家，擅长将简单的项目描述优化为专业的简历内容。

规则：
1. 不虚构用户没有提供的技术或功能。
2. 使用专业术语和企业招聘语言。
3. 突出技术实现和个人贡献。
4. 优化后的描述应简洁、有信息量，适合放在简历中。
5. 控制在 1-3 句话。

你必须以 JSON 格式输出，不要包含任何其他文字。`

export function buildProjectOptimizePrompt(project: {
  name: string
  description: string
  technology: string
  role: string
}): { system: string; user: string } {
  const userPrompt = `请优化以下项目描述，使其更适合放在简历中：

项目名称：${project.name || '未填写'}
当前描述：${project.description || '无描述'}
技术栈：${project.technology || '未填写'}
个人职责：${project.role || '未填写'}

请输出以下 JSON 格式：
{
  "optimizedDescription": "优化后的项目描述，1-3句话"
}`

  return { system: SYSTEM_PROMPT, user: userPrompt }
}
