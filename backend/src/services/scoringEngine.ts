/**
 * Rule-based scoring engine for resume evaluation.
 * Deterministic — same input always produces same output.
 * No AI calls involved.
 */

import { getSkillWeight, getAllSkillNames, frontendTaxonomy } from '../data/frontendTaxonomy'

// ─── Types ───

export interface DimensionScore {
  score: number // 0-100
  weight: number // percentage weight in overall score
  reasons: string[] // human-readable explanations (Chinese)
}

export interface ScoreBreakdown {
  starCompleteness: DimensionScore
  quantitativeMetrics: DimensionScore
  keywordDensity: DimensionScore
  actionVerbs: DimensionScore
  contentCompleteness: DimensionScore
  jobMatch: DimensionScore
  lengthBalance: DimensionScore
}

export interface RuleBasedScoreResult {
  overallScore: number // 0-100
  dimensionScores: {
    contentCompleteness: number
    jobMatch: number
    keywordCoverage: number
  }
  breakdown: ScoreBreakdown
}

export interface ScoringInput {
  resumeText: string
  projects: Array<{
    name: string
    description: string
    technology: string
    role: string
  }>
  skills: string[]
  targetRole: string
  summary?: string
  hasEmail?: boolean
  hasEducation?: boolean
}

// ─── Constants ───

const STRONG_ACTION_VERBS = [
  // Chinese
  '设计',
  '实现',
  '开发',
  '构建',
  '优化',
  '重构',
  '部署',
  '主导',
  '搭建',
  '封装',
  '抽象',
  '架构',
  '研发',
  '打造',
  '完成',
  '独立开发',
  '负责',
  '提升',
  '降低',
  '解决',
  '攻克',
  '引入',
  '迁移',
  '重构',
  '编写',
  '创建',
  '管理',
  '协调',
  '推进',
  '落地',
  // English
  'designed',
  'implemented',
  'developed',
  'built',
  'optimized',
  'refactored',
  'deployed',
  'led',
  'architected',
  'engineered',
  'created',
  'reduced',
  'improved',
  'achieved',
  'delivered',
  'spearheaded',
]

const WEAK_ACTION_VERBS = [
  // Chinese
  '参与',
  '做了',
  '用过',
  '了解',
  '接触',
  '帮忙',
  '协助',
  '跟着',
  '学过',
  '尝试',
  '简单',
  ' basic',
  // English
  'helped',
  'assisted',
  'used',
  'familiar with',
  'learned',
  'tried',
  'participated in',
  'was involved in',
]

const QUANTITATIVE_PATTERNS = [
  /\d+[%％]/, // 85%, 90％
  /\d+\+?\s*[个位台条项次万人页面]+/, // 10个模块, 5台服务器
  /\d+\s*ms/, // 200ms
  /\d+\s*x\b/, // 3x improvement
  /提升.{0,8}\d+/, // 提升50%
  /降低.{0,8}\d+/, // 降低30%
  /(?:用户|访问量|并发|pv|uv|qps).{0,5}\d+/i,
  /\d+\s*(?:万|k\+)/i, // 10万用户, 5k+ stars
  /\d+\s*(?:秒|分钟|小时)/, // 3秒加载
]

// ─── Scoring Functions ───

function scoreSTAR(input: ScoringInput): DimensionScore {
  const reasons: string[] = []
  let rawScore = 0
  const totalProjects = input.projects.length

  if (totalProjects === 0) {
    return { score: 0, weight: 20, reasons: ['没有填写项目经历'] }
  }

  let projectScores = 0

  for (const project of input.projects) {
    const text = `${project.description} ${project.role}`.toLowerCase()
    let pScore = 0
    const pReasons: string[] = []

    // Check for action/result oriented language (A + R in STAR)
    const hasAction = STRONG_ACTION_VERBS.some((v) => text.includes(v))
    const hasWeak = WEAK_ACTION_VERBS.some((v) => text.includes(v))

    if (hasAction) {
      pScore += 40
      pReasons.push('使用了专业动作动词')
    } else if (hasWeak) {
      pScore += 10
      pReasons.push('使用了较弱的动作描述（如"参与"、"做了"）')
    } else {
      pReasons.push('缺少明确的动作描述')
    }

    // Check for context/background (S in STAR)
    if (project.name && project.description.length > 20) {
      pScore += 20
      pReasons.push('有项目背景描述')
    }

    // Check for technology specifics (T in STAR)
    if (project.technology && project.technology.trim().length > 0) {
      pScore += 20
      pReasons.push('提到了技术栈')
    }

    // Check for results/outcomes (R in STAR)
    const hasResult = QUANTITATIVE_PATTERNS.some((p) => p.test(text))
    if (hasResult) {
      pScore += 20
      pReasons.push('包含量化成果')
    } else {
      pReasons.push('缺少量化成果数据')
    }

    projectScores += pScore
    if (pScore < 60) {
      reasons.push(
        `项目「${project.name}」：${pReasons.filter((r) => r.includes('缺少') || r.includes('较弱')).join('；')}`,
      )
    }
  }

  rawScore = Math.round(projectScores / totalProjects)

  if (rawScore >= 80) reasons.unshift('项目描述整体质量优秀')
  if (reasons.length === 0) reasons.push('项目描述基本完整')

  return { score: Math.min(100, rawScore), weight: 20, reasons }
}

function scoreQuantitative(input: ScoringInput): DimensionScore {
  const reasons: string[] = []
  const allText = [
    input.summary || '',
    ...input.projects.map((p) => `${p.description} ${p.role}`),
  ].join(' ')

  let matchCount = 0
  const matchedPatterns: string[] = []

  for (const pattern of QUANTITATIVE_PATTERNS) {
    if (pattern.test(allText)) {
      matchCount++
      matchedPatterns.push(pattern.source)
    }
  }

  // Also count raw number mentions
  const numberMentions = (allText.match(/\d+/g) || []).length

  if (matchCount >= 3) {
    reasons.push('多处使用量化数据（百分比、用户量、性能指标等）')
  } else if (matchCount >= 1) {
    reasons.push('有少量量化数据，建议增加更多具体数字')
  } else {
    reasons.push('缺少量化指标，建议添加具体的数字（如用户量、性能提升百分比、代码行数等）')
  }

  if (numberMentions >= 5 && matchCount < 2) {
    reasons.push('虽然有数字，但不够具体——尝试用"提升30%"替代"提升了很多"')
  }

  const score = Math.min(100, matchCount * 30 + numberMentions * 5)

  return { score, weight: 20, reasons }
}

function scoreKeywordDensity(input: ScoringInput): DimensionScore {
  const reasons: string[] = []
  const allText = [
    input.summary || '',
    ...input.projects.map((p) => `${p.description} ${p.technology} ${p.role}`),
    input.skills.join(' '),
  ].join(' ')
  const lowerText = allText.toLowerCase()

  const allSkills = getAllSkillNames()
  let matchedCount = 0

  for (const skill of allSkills) {
    if (lowerText.includes(skill)) {
      matchedCount++
    }
  }

  // Also check user's explicit skills
  for (const skill of input.skills) {
    if (!allSkills.includes(skill.toLowerCase())) {
      matchedCount += 0.5 // Non-taxonomy skills count half
    }
  }

  const density = matchedCount / Math.max(allSkills.length * 0.3, 1) // Normalize against reasonable coverage
  const score = Math.min(100, Math.round(density * 100))

  if (score >= 70) {
    reasons.push('技术关键词覆盖丰富')
  } else if (score >= 40) {
    reasons.push('技术关键词覆盖面一般，建议补充更多相关技术')
  } else {
    reasons.push('技术关键词偏少，建议在项目描述中提及使用的具体技术')
  }

  return { score, weight: 15, reasons }
}

function scoreActionVerbs(input: ScoringInput): DimensionScore {
  const reasons: string[] = []
  const allText = [
    ...input.projects.map((p) => `${p.description} ${p.role}`),
    input.summary || '',
  ].join(' ')
  const lowerText = allText.toLowerCase()

  let strongCount = 0
  let weakCount = 0

  for (const verb of STRONG_ACTION_VERBS) {
    if (lowerText.includes(verb)) strongCount++
  }
  for (const verb of WEAK_ACTION_VERBS) {
    if (lowerText.includes(verb)) weakCount++
  }

  const strongScore = Math.min(60, strongCount * 15)
  const weakPenalty = weakCount * 15

  let score = Math.max(0, Math.min(100, strongScore + 40 - weakPenalty))

  if (strongCount >= 4) {
    reasons.push('使用了多个强有力的动作动词（设计、实现、优化等）')
  } else if (strongCount >= 2) {
    reasons.push('动作动词使用较少，建议每个项目用"负责/实现/设计"开头')
  } else {
    reasons.push('缺少强有力的动作动词，用"设计/实现/开发/优化"替代模糊描述')
    score = Math.max(0, score - 20)
  }

  if (weakCount > 0) {
    reasons.push(`发现${weakCount}处弱动词（如"参与"、"做了"），建议改为具体动作`)
  }

  return { score, weight: 15, reasons }
}

function scoreContentCompleteness(input: ScoringInput): DimensionScore {
  const reasons: string[] = []
  let score = 0

  const checks: Array<{ field: string; present: boolean; points: number }> = [
    { field: '姓名', present: input.resumeText.length > 0, points: 15 },
    { field: '联系方式（邮箱）', present: !!input.hasEmail, points: 15 },
    { field: '教育经历', present: !!input.hasEducation, points: 15 },
    { field: '技能列表', present: input.skills.length > 0, points: 20 },
    { field: '项目经历', present: input.projects.length > 0, points: 20 },
    { field: '个人简介', present: !!input.summary && input.summary.trim().length > 10, points: 15 },
  ]

  for (const check of checks) {
    if (check.present) {
      score += check.points
    } else {
      reasons.push(`缺少${check.field}`)
    }
  }

  if (reasons.length === 0) {
    reasons.push('简历内容模块完整')
  }

  return { score, weight: 15, reasons }
}

function scoreJobMatch(input: ScoringInput): DimensionScore {
  const reasons: string[] = []

  if (!input.targetRole || input.targetRole.trim() === '') {
    return {
      score: 50,
      weight: 10,
      reasons: ['未指定目标岗位，无法评估匹配度'],
    }
  }

  const role = input.targetRole.toLowerCase()
  const skillLower = input.skills.map((s) => s.toLowerCase())
  const allText = [
    input.summary || '',
    ...input.projects.map((p) => `${p.description} ${p.technology}`),
  ]
    .join(' ')
    .toLowerCase()

  // Define expected skills for common frontend roles
  const roleKeywords: Record<string, { must: string[]; nice: string[] }> = {
    前端: {
      must: ['javascript', 'html', 'css'],
      nice: ['react', 'vue', 'typescript', 'webpack', 'vite', 'git'],
    },
    react: {
      must: ['react', 'javascript', 'html', 'css'],
      nice: ['typescript', 'redux', 'zustand', 'next', 'tailwind', 'webpack'],
    },
    vue: {
      must: ['vue', 'javascript', 'html', 'css'],
      nice: ['typescript', 'pinia', 'vuex', 'nuxt', 'element', 'tailwind'],
    },
    全栈: {
      must: ['javascript', 'node', 'react'],
      nice: ['typescript', 'mongodb', 'postgresql', 'docker', 'express', 'api'],
    },
    后端: {
      must: ['node', 'javascript'],
      nice: ['typescript', 'mongodb', 'postgresql', 'redis', 'docker', 'api', 'mysql'],
    },
    java: {
      must: ['java'],
      nice: ['spring', 'mysql', 'redis', 'docker', 'maven', '微服务'],
    },
  }

  // Find the best matching role profile
  let matchedRole: { must: string[]; nice: string[] } | null = null
  for (const [keyword, profile] of Object.entries(roleKeywords)) {
    if (role.includes(keyword)) {
      matchedRole = profile
      break
    }
  }

  if (!matchedRole) {
    return {
      score: 60,
      weight: 10,
      reasons: [`目标岗位「${input.targetRole}」暂未建立技能模型，给出基础匹配分`],
    }
  }

  const mustMatch = matchedRole.must.filter(
    (s) => skillLower.some((us) => us.includes(s)) || allText.includes(s),
  ).length
  const niceMatch = matchedRole.nice.filter(
    (s) => skillLower.some((us) => us.includes(s)) || allText.includes(s),
  ).length

  const mustTotal = matchedRole.must.length
  const niceTotal = matchedRole.nice.length

  const score = Math.round((mustMatch / mustTotal) * 70 + (niceMatch / niceTotal) * 30)

  if (mustMatch < mustTotal) {
    const missing = matchedRole.must.filter(
      (s) => !skillLower.some((us) => us.includes(s)) && !allText.includes(s),
    )
    reasons.push(`缺少目标岗位核心技能：${missing.join('、')}`)
  } else {
    reasons.push('核心技能覆盖完整')
  }

  if (niceMatch > 0) {
    reasons.push(`具备${niceMatch}项加分技能`)
  }

  return { score, weight: 10, reasons }
}

function scoreLengthBalance(input: ScoringInput): DimensionScore {
  const reasons: string[] = []
  let score = 50 // Base score

  // Check project description lengths
  const projLengths = input.projects.map((p) => p.description.length)
  const avgLength =
    projLengths.length > 0 ? projLengths.reduce((a, b) => a + b, 0) / projLengths.length : 0

  if (avgLength >= 50 && avgLength <= 300) {
    score += 25
    reasons.push('项目描述长度适中')
  } else if (avgLength < 20) {
    reasons.push('项目描述过短，建议每个项目写50-200字')
  } else if (avgLength > 500) {
    score += 10
    reasons.push('项目描述偏长，建议精简到核心信息')
  }

  // Check summary length
  if (input.summary) {
    const summaryLen = input.summary.trim().length
    if (summaryLen >= 20 && summaryLen <= 200) {
      score += 15
      reasons.push('个人简介长度合适')
    } else if (summaryLen > 0 && summaryLen < 20) {
      reasons.push('个人简介过短，建议2-3句话')
    }
  }

  // Check skill count
  if (input.skills.length >= 4 && input.skills.length <= 15) {
    score += 10
    reasons.push('技能数量合理')
  } else if (input.skills.length < 3) {
    reasons.push('技能偏少，建议至少列出4-6项')
  } else if (input.skills.length > 20) {
    reasons.push('技能数量过多，建议精简到最相关的10-15项')
  }

  score = Math.max(0, Math.min(100, score))

  if (reasons.length === 0) {
    reasons.push('简历各模块长度基本合理')
  }

  return { score, weight: 5, reasons }
}

// ─── Main Scoring Function ───

export function scoreResume(input: ScoringInput): RuleBasedScoreResult {
  const breakdown: ScoreBreakdown = {
    starCompleteness: scoreSTAR(input),
    quantitativeMetrics: scoreQuantitative(input),
    keywordDensity: scoreKeywordDensity(input),
    actionVerbs: scoreActionVerbs(input),
    contentCompleteness: scoreContentCompleteness(input),
    jobMatch: scoreJobMatch(input),
    lengthBalance: scoreLengthBalance(input),
  }

  // Calculate weighted overall score
  const dimensions = Object.values(breakdown)
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0)
  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight,
  )

  // Map to the 3-dimension scores the frontend expects
  const dimensionScores = {
    contentCompleteness: breakdown.contentCompleteness.score,
    jobMatch: breakdown.jobMatch.score,
    keywordCoverage: breakdown.keywordDensity.score,
  }

  return { overallScore, dimensionScores, breakdown }
}
