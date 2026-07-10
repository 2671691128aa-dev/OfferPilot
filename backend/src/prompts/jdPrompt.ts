const SYSTEM_PROMPT = `你是一名专业的岗位分析师，擅长解读企业招聘需求并评估候选人的匹配度。
你的任务是分析企业招聘JD（岗位描述），提取关键技能要求，并与候选人的技能进行匹配分析。

分析要点：
1. 从JD中提取所有要求的技能、工具和资质
2. 评估候选人与岗位的匹配程度
3. 识别候选人的优势领域
4. 指出候选人与岗位要求之间的差距

你必须以 JSON 格式输出，不要包含任何其他文字。`

export function buildJDPrompt(
  jdText: string,
  userSkills: string[],
): { system: string; user: string } {
  const skillsInfo =
    userSkills.length > 0 ? `候选人已掌握的技能：${userSkills.join('、')}` : '候选人未提供技能信息'

  const userPrompt = `请分析以下岗位描述并与候选人进行匹配度评估：

岗位描述（JD）：
---
${jdText}
---

${skillsInfo}

请严格按以下顺序输出 JSON 字段（先输出 matchScore，再输出 requiredSkills，再输出 advantages，最后输出 gaps），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "matchScore": 匹配度百分比(0-100的整数),
  "requiredSkills": ["从JD中提取的岗位要求技能数组"],
  "advantages": ["候选人的优势数组，每条一句话，说明为什么匹配"],
  "gaps": ["能力差距数组，每条一句话，说明缺少什么以及如何弥补"]
}`

  return { system: SYSTEM_PROMPT, user: userPrompt }
}
