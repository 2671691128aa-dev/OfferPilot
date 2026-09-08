import { scoreResume, ScoringInput } from '../services/scoringEngine'

describe('Scoring Engine', () => {
  const makeInput = (overrides: Partial<ScoringInput> = {}): ScoringInput => ({
    resumeText: '张三 计算机专业学生',
    projects: [],
    skills: [],
    targetRole: '',
    summary: '',
    hasEmail: false,
    hasEducation: false,
    ...overrides,
  })

  it('should give high score for complete resume with strong content', () => {
    const input = makeInput({
      resumeText: '张三 前端开发实习生 计算机专业',
      summary: '计算机专业本科生，熟悉React和TypeScript开发，具备多个Web项目开发经验。',
      hasEmail: true,
      hasEducation: true,
      skills: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Git', 'Webpack'],
      projects: [
        {
          name: '校园商城系统',
          description:
            '基于React开发电商管理系统，实现商品展示、购物车管理和用户交互功能，提升页面响应效率30%。',
          technology: 'React TypeScript Ant Design',
          role: '独立开发前端页面，设计并实现组件库',
        },
      ],
      targetRole: '前端开发实习',
    })

    const result = scoreResume(input)

    expect(result.overallScore).toBeGreaterThan(60)
    expect(result.dimensionScores.contentCompleteness).toBeGreaterThan(50)
    expect(result.breakdown.starCompleteness.score).toBeGreaterThan(50)
  })

  it('should give low score when projects are missing', () => {
    const input = makeInput({
      resumeText: '张三',
      summary: '学生',
      skills: ['JavaScript'],
      targetRole: '前端开发',
    })

    const result = scoreResume(input)

    expect(result.breakdown.starCompleteness.score).toBe(0)
    expect(result.breakdown.starCompleteness.reasons).toContain('没有填写项目经历')
    expect(result.overallScore).toBeLessThan(40)
  })

  it('should score job match higher when skills align with target role', () => {
    const frontendInput = makeInput({
      skills: ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript'],
      projects: [
        {
          name: '个人网站',
          description: '使用React开发的个人展示网站',
          technology: 'React',
          role: '前端开发',
        },
      ],
      targetRole: '前端开发实习',
    })

    const backendInput = makeInput({
      skills: ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript'],
      projects: [
        {
          name: '个人网站',
          description: '使用React开发的个人展示网站',
          technology: 'React',
          role: '前端开发',
        },
      ],
      targetRole: 'Java后端开发实习',
    })

    const frontendResult = scoreResume(frontendInput)
    const backendResult = scoreResume(backendInput)

    expect(frontendResult.breakdown.jobMatch.score).toBeGreaterThan(
      backendResult.breakdown.jobMatch.score,
    )
  })

  it('should penalize missing quantitative metrics', () => {
    const input = makeInput({
      resumeText: '张三',
      summary: '计算机学生，做过一些项目',
      skills: ['React'],
      projects: [
        {
          name: '商城项目',
          description: '做了一个商城',
          technology: 'React',
          role: '参与开发',
        },
      ],
      targetRole: '前端开发',
    })

    const result = scoreResume(input)

    expect(result.breakdown.quantitativeMetrics.score).toBeLessThan(30)
    expect(result.breakdown.actionVerbs.score).toBeLessThan(50)
  })

  it('should handle edge case of empty input gracefully', () => {
    const input = makeInput()
    const result = scoreResume(input)

    expect(result.overallScore).toBeGreaterThanOrEqual(0)
    expect(result.overallScore).toBeLessThanOrEqual(100)
    expect(result.breakdown).toBeDefined()
    expect(result.dimensionScores).toBeDefined()
  })
})
