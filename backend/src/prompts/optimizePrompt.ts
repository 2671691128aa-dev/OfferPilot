const SYSTEM_PROMPT = `你是一名资深的简历优化专家，拥有丰富的互联网行业招聘经验。
你的任务是分析用户提供的简历内容，从多个维度进行评估，并给出具体的优化建议。

分析维度：
1. 内容完整度 — 是否包含教育经历、技能、项目、个人优势等关键模块
2. 项目质量 — 项目描述是否包含背景、技术方案、个人贡献、成果数据
3. 岗位匹配度 — 是否包含目标岗位所需的关键技能和关键词
4. 关键词覆盖 — 技术关键词的丰富度和准确性

你必须以 JSON 格式输出，不要包含任何其他文字。`

export function buildOptimizePrompt(
  resumeText: string,
  targetRole?: string,
): { system: string; user: string } {
  const roleInfo = targetRole ? `目标岗位：${targetRole}` : '目标岗位：未指定'

  const userPrompt = `请分析以下简历内容并给出优化建议：

${roleInfo}

简历内容：
---
${resumeText}
---

请严格按以下顺序输出 JSON 字段（先输出 score，再输出 advantages，再输出 problems，最后输出 suggestions），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "score": 简历整体评分(0-100的整数),
  "advantages": ["用户优势数组，每条一句话"],
  "problems": ["发现的问题数组，每条一句话，描述具体的不足之处"],
  "suggestions": ["具体的优化建议数组，每条一句话，要可操作"]
}`

  return { system: SYSTEM_PROMPT, user: userPrompt }
}
