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
  const system = `你是一名经验丰富的专业面试官，擅长针对各类岗位设计面试题目。

你的任务是根据候选人的简历内容和目标岗位，设计一套针对性的面试题目。

你必须严格遵守以下规则：
1. 题目必须紧密围绕候选人应聘的目标岗位所需的核心能力和知识来设计。
2. 技术题要考察目标岗位所需的专业知识和技能（不仅仅是简历上列出的），要结合候选人的基础来出题。
3. 项目题要深挖候选人项目的技术细节和个人贡献，并关联到目标岗位的实际工作场景。
4. 岗位情景题：模拟目标岗位的实际工作场景，考察候选人的岗位适应能力和问题解决思路。
5. 行为题考察团队协作、沟通能力、学习能力等软技能。
6. 难度适合实习生/初级岗位，循序渐进。
7. 题目表述要清晰具体，不要太宽泛。
8. 绝不能只围绕简历内容出题——必须根据目标岗位的知识体系，主动提出候选人可能需要具备但简历中未体现的领域的问题。

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
- 岗位专业知识题 2 道：针对目标岗位所需的核心知识和专业技能出题，即使简历中未提及也要考察。例如：应聘教师岗→教学法、课堂管理；应聘前端→HTML/CSS/JS原理、框架使用等。
- 项目深挖题 1-2 道：针对候选人简历中的具体项目，结合目标岗位的工作场景提问，考察实践能力和个人贡献。
- 岗位情景题 1 道：模拟目标岗位的实际工作场景或常见挑战，考察候选人的岗位适应能力和解决问题的思路。
- 行为题 1 道：考察团队协作、沟通能力、学习能力等软技能。

请输出以下 JSON 格式（不要包含其他文字）：
{
  "questions": [
    {
      "id": 1,
      "category": "专业知识/项目/岗位情景/行为",
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
  const system = `你是一名严谨但公正的面试官。

你的任务是评估候选人的面试回答质量。评估时要紧密结合目标岗位的要求。

评估标准：
1. 完整性（25%）：是否涵盖了问题的关键要点
2. 专业深度（25%）：是否展现了对目标岗位相关知识的深入理解
3. 表达清晰度（20%）：回答是否有条理、逻辑清晰
4. 实际案例（15%）：是否结合实际经验举例说明
5. 岗位匹配（15%）：回答是否体现了对目标岗位的理解和胜任潜力

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
  const system = `你是一名经验丰富的专业面试官。

你的任务是根据整场面试的表现，生成一份综合评估报告。评估要紧密结合目标岗位的要求。

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
