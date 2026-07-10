export interface CareerRoadmapInput {
  skills: string[]
  projects: Array<{
    name: string
    description: string
    technology: string
    role: string
  }>
  targetRole: string
  scoreBreakdown?: {
    starCompleteness: { score: number; weight: number; reasons: string[] }
    quantitativeMetrics: { score: number; weight: number; reasons: string[] }
    keywordDensity: { score: number; weight: number; reasons: string[] }
    actionVerbs: { score: number; weight: number; reasons: string[] }
    contentCompleteness: { score: number; weight: number; reasons: string[] }
    jobMatch: { score: number; weight: number; reasons: string[] }
    lengthBalance: { score: number; weight: number; reasons: string[] }
  }
}

const SYSTEM_PROMPT = `你是一名资深的前端职业规划师，拥有丰富的互联网行业经验。

你的任务是根据求职者的当前技能、项目经历和规则评分结果，给出一份个性化的职业成长路线图。

你必须严格遵守以下规则：
1. 建议必须基于用户的真实情况，不能泛泛而谈。
2. 技能缺口分析要结合评分细项中的具体问题。
3. 项目建议要具体到技术栈和核心功能，不能只说"做一个XX项目"。
4. 计划要可执行，包含具体的学习步骤。
5. 推荐资源要真实存在的（课程名、书名、官方文档等）。

你必须以 JSON 格式输出，不要包含任何其他文字。`

export function buildCareerRoadmapPrompt(data: CareerRoadmapInput): {
  system: string
  user: string
} {
  const weaknessReasons: string[] = []
  if (data.scoreBreakdown) {
    const bd = data.scoreBreakdown
    for (const [, dim] of Object.entries(bd)) {
      if (dim.score < 60) {
        weaknessReasons.push(
          ...dim.reasons.filter(
            (r) =>
              r.includes('缺少') || r.includes('不足') || r.includes('偏少') || r.includes('过短'),
          ),
        )
      }
    }
  }

  const userPrompt = `请根据以下信息生成职业成长路线图：

目标岗位：${data.targetRole || '未指定'}

当前技能：${data.skills.length > 0 ? data.skills.join('、') : '未填写'}

项目经历：
${
  data.projects.length > 0
    ? data.projects
        .map((p, i) => `项目${i + 1}：${p.name}（技术栈：${p.technology || '未填写'}）`)
        .join('\n')
    : '未填写'
}

评分薄弱环节：
${weaknessReasons.length > 0 ? weaknessReasons.map((r) => `- ${r}`).join('\n') : '暂无'}

请严格按以下顺序输出 JSON 字段（先输出 currentLevel，再输出 levelAnalysis，再输出 skillGaps，再输出 projectSuggestions，再输出 shortTermPlan，再输出 midTermPlan，最后输出 recommendedResources），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "currentLevel": "入门/初级/中级（根据技能数量、项目质量、评分综合判断）",
  "levelAnalysis": "当前水平分析，2-3句话",
  "skillGaps": [
    {
      "skill": "技能名称",
      "priority": "高/中/低",
      "reason": "为什么需要学习这个技能"
    }
  ],
  "projectSuggestions": [
    {
      "title": "建议项目名称",
      "description": "项目描述和核心功能，1-2句话",
      "skillsLearned": ["能学到的技能"]
    }
  ],
  "shortTermPlan": ["1-2周内的具体行动计划"],
  "midTermPlan": ["1-3个月内的中期目标"],
  "recommendedResources": ["推荐的学习资源名称"]
}`

  return { system: SYSTEM_PROMPT, user: userPrompt }
}
