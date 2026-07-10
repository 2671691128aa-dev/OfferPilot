// ─── Interview Prompt Builders ───

interface ResumeData {
  skills: string[]
  projects: Array<{ name: string; description: string; technology?: string; role?: string }>
  summary?: string
}

/**
 * Build prompt for generating interview questions based on the user's resume.
 */
export function buildInterviewQuestionsPrompt(
  targetRole: string,
  resumeData: ResumeData,
): { system: string; user: string } {
  const system = `你是一名资深的前端技术面试官，拥有多年互联网大厂面试经验。

你的任务是根据候选人的简历内容，设计一套针对性的面试题目。

你必须严格遵守以下规则：
1. 题目必须基于候选人简历中的真实内容，不能凭空出题。
2. 技术题要考察候选人声称掌握的技术的深度理解。
3. 项目题要深挖候选人项目的技术细节和个人贡献。
4. 行为题考察团队协作、问题解决等软技能。
5. 难度适合实习生/初级岗位，循序渐进。
6. 题目表述要清晰具体，不要太宽泛。

你必须以 JSON 格式输出，不要包含任何其他文字。`

  const projectSummary =
    resumeData.projects.length > 0
      ? resumeData.projects
          .map(
            (p, i) =>
              `项目${i + 1}：${p.name}（${p.technology || '技术栈未注明'}）- ${p.description || '无描述'}`,
          )
          .join('\n')
      : '无项目经历'

  const user = `候选人信息：
目标岗位：${targetRole || '未指定'}
技能：${resumeData.skills.length > 0 ? resumeData.skills.join('、') : '未填写'}
项目经历：
${projectSummary}
${resumeData.summary ? `个人简介：${resumeData.summary}` : ''}

请生成 6 道面试题目，按以下比例分配：
- 技术题 2-3 道：基于候选人声称掌握的技术，考察原理和实践
- 项目深挖题 2-3 道：针对具体项目的技术方案和个人贡献
- 行为题 1-2 道：考察团队协作、学习能力、问题解决等

请输出以下 JSON 格式（不要包含其他文字）：
{
  "questions": [
    {
      "id": 1,
      "category": "技术/项目/行为",
      "question": "面试题目内容",
      "context": "为什么问这个问题（一句话说明考察点）",
      "expectedTopics": ["期望回答中涉及的要点"]
    }
  ]
}`

  return { system, user }
}

/**
 * Build prompt for evaluating a single interview answer.
 */
export function buildAnswerEvalPrompt(
  question: string,
  expectedTopics: string[],
  userAnswer: string,
  targetRole: string,
): { system: string; user: string } {
  const system = `你是一名严谨但公正的技术面试官。

你的任务是评估候选人的面试回答质量。

评估标准：
1. 完整性（30%）：是否涵盖了问题的关键要点
2. 技术深度（30%）：是否展现了对技术的深入理解
3. 表达清晰度（20%）：回答是否有条理、逻辑清晰
4. 实际案例（20%）：是否结合了自己的项目经验举例说明

评分规则：
- 90-100：优秀，全面深入，有实际案例支撑
- 70-89：良好，覆盖主要要点，有一定深度
- 50-69：一般，回答不完整或过于表面
- 30-49：较差，偏离问题或过于简略
- 0-29：很差，答非所问或空白

你必须以 JSON 格式输出，不要包含任何其他文字。`

  const user = `目标岗位：${targetRole || '未指定'}

面试题目：${question}

期望涉及要点：${expectedTopics.join('、') || '无特定要求'}

候选人回答：
${userAnswer}

请输出以下 JSON 格式（不要包含其他文字）：
{
  "score": 评分(0-100整数),
  "strengths": ["回答的优点数组"],
  "weaknesses": ["回答的不足数组"],
  "suggestedImprovement": "具体的改进建议，1-2句话",
  "strongExample": "一个更优秀的回答示例，2-4句话"
}`

  return { system, user }
}

/**
 * Build prompt for generating the comprehensive interview report.
 */
export function buildInterviewReportPrompt(
  targetRole: string,
  questions: Array<{ id: number; category: string; question: string }>,
  answers: Array<{ questionId: number; answer: string; score: number }>,
): { system: string; user: string } {
  const system = `你是一名经验丰富的技术面试官。

你的任务是根据整场面试的表现，生成一份综合评估报告。

报告要求：
1. 整体评估要客观公正
2. 优势总结要具体，不要泛泛而谈
3. 改进方向要可操作
4. 推荐练习话题要有针对性

你必须以 JSON 格式输出，不要包含任何其他文字。`

  const qAndA = questions
    .map((q) => {
      const ans = answers.find((a) => a.questionId === q.id)
      return `题目${q.id}（${q.category}）：${q.question}\n得分：${ans?.score ?? '未作答'}\n回答摘要：${ans?.answer ? ans.answer.substring(0, 100) + '...' : '未作答'}`
    })
    .join('\n\n')

  const avgScore =
    answers.length > 0
      ? Math.round(answers.reduce((sum, a) => sum + a.score, 0) / answers.length)
      : 0

  const user = `目标岗位：${targetRole || '未指定'}

面试题目与回答：
${qAndA}

平均得分：${avgScore}/100

请输出以下 JSON 格式（不要包含其他文字）：
{
  "overallScore": 综合评分(0-100整数),
  "questionScores": [{"questionId": 题号, "score": 分数}],
  "topStrengths": ["候选人最突出的2-3个优势"],
  "keyImprovements": ["最需要改进的2-3个方面"],
  "practiceTopics": ["建议重点练习的话题/技术点"],
  "summary": "面试表现总结，3-5句话"
}`

  return { system, user }
}
