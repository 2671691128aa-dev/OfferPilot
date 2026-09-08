export interface SkillEntry {
  name: string
  weight: number
  alternatives: string[]
}

export interface SkillCategory {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced'
  skills: SkillEntry[]
}

export interface DirectionTaxonomy {
  name: string
  keywords: string[]
  categories: SkillCategory[]
}

export const skillTaxonomy: DirectionTaxonomy[] = [
  {
    name: '前端开发',
    keywords: ['前端', 'frontend', 'react', 'vue', 'web'],
    categories: [
      {
        name: '基础语言',
        level: 'beginner',
        skills: [
          { name: 'HTML', weight: 1, alternatives: ['html5'] },
          { name: 'CSS', weight: 1, alternatives: ['css3', 'flexbox', 'grid'] },
          { name: 'JavaScript', weight: 2, alternatives: ['js', 'es6'] },
        ],
      },
      {
        name: '框架',
        level: 'intermediate',
        skills: [
          { name: 'React', weight: 5, alternatives: ['reactjs', 'react hooks'] },
          { name: 'Vue', weight: 5, alternatives: ['vuejs', 'vue3'] },
          { name: 'Angular', weight: 5, alternatives: ['angularjs'] },
          { name: 'Next.js', weight: 5, alternatives: ['nextjs'] },
          { name: 'Nuxt', weight: 5, alternatives: ['nuxtjs'] },
        ],
      },
      {
        name: '类型系统',
        level: 'intermediate',
        skills: [{ name: 'TypeScript', weight: 3, alternatives: ['ts'] }],
      },
      {
        name: '构建工具',
        level: 'intermediate',
        skills: [
          { name: 'Webpack', weight: 2, alternatives: ['webpack5'] },
          { name: 'Vite', weight: 3, alternatives: ['vitejs'] },
          { name: 'ESLint', weight: 2, alternatives: ['eslint'] },
        ],
      },
      {
        name: '状态管理',
        level: 'advanced',
        skills: [
          { name: 'Redux', weight: 3, alternatives: ['redux toolkit', 'rtk'] },
          { name: 'Zustand', weight: 3, alternatives: ['zustand'] },
          { name: 'Pinia', weight: 3, alternatives: ['pinia'] },
          { name: 'MobX', weight: 3, alternatives: ['mobx'] },
        ],
      },
      {
        name: 'CSS 工具',
        level: 'intermediate',
        skills: [
          { name: 'Tailwind CSS', weight: 3, alternatives: ['tailwind'] },
          { name: 'Sass', weight: 2, alternatives: ['scss'] },
          { name: 'Ant Design', weight: 2, alternatives: ['antd'] },
          { name: 'Element UI', weight: 2, alternatives: ['element-ui', 'element-plus'] },
        ],
      },
      {
        name: '测试',
        level: 'advanced',
        skills: [
          { name: 'Jest', weight: 3, alternatives: ['jest'] },
          { name: 'Vitest', weight: 3, alternatives: ['vitest'] },
          { name: 'Cypress', weight: 3, alternatives: ['cypress'] },
          { name: 'Playwright', weight: 3, alternatives: ['playwright'] },
        ],
      },
      {
        name: '性能优化',
        level: 'advanced',
        skills: [
          { name: 'Lighthouse', weight: 2, alternatives: ['web vitals'] },
          { name: 'SSR', weight: 3, alternatives: ['ssr', '服务端渲染'] },
          { name: 'SSG', weight: 2, alternatives: ['ssg'] },
        ],
      },
    ],
  },
  {
    name: 'Java 后端开发',
    keywords: ['java', '后端', 'backend', 'spring', 'springboot'],
    categories: [
      {
        name: 'Java 基础',
        level: 'beginner',
        skills: [
          { name: 'Java', weight: 3, alternatives: ['java8', 'java11', 'java17'] },
          { name: 'JVM', weight: 2, alternatives: ['jvm', 'jmm'] },
          { name: '多线程', weight: 2, alternatives: ['concurrent', 'thread', 'executor'] },
        ],
      },
      {
        name: '框架',
        level: 'intermediate',
        skills: [
          { name: 'Spring', weight: 5, alternatives: ['spring framework'] },
          { name: 'Spring Boot', weight: 5, alternatives: ['springboot', 'boot'] },
          { name: 'Spring MVC', weight: 3, alternatives: ['springmvc'] },
          { name: 'MyBatis', weight: 3, alternatives: ['mybatis', 'mybatis-plus'] },
          { name: 'Hibernate', weight: 3, alternatives: ['hibernate', 'jpa'] },
        ],
      },
      {
        name: '微服务',
        level: 'advanced',
        skills: [
          { name: 'Spring Cloud', weight: 4, alternatives: ['springcloud'] },
          { name: 'Dubbo', weight: 3, alternatives: ['dubbo'] },
          { name: 'Nacos', weight: 3, alternatives: ['nacos'] },
          { name: 'Gateway', weight: 3, alternatives: ['spring cloud gateway'] },
        ],
      },
      {
        name: '数据库',
        level: 'intermediate',
        skills: [
          { name: 'MySQL', weight: 4, alternatives: ['mysql'] },
          { name: 'Redis', weight: 3, alternatives: ['redis'] },
          { name: 'PostgreSQL', weight: 3, alternatives: ['postgresql', 'postgres'] },
          { name: 'MongoDB', weight: 2, alternatives: ['mongodb'] },
        ],
      },
      {
        name: '中间件',
        level: 'advanced',
        skills: [
          { name: 'Kafka', weight: 3, alternatives: ['kafka'] },
          { name: 'RabbitMQ', weight: 3, alternatives: ['rabbitmq'] },
          { name: 'Elasticsearch', weight: 3, alternatives: ['es', 'elasticsearch'] },
        ],
      },
      {
        name: '工具',
        level: 'intermediate',
        skills: [
          { name: 'Maven', weight: 2, alternatives: ['maven', 'mvn'] },
          { name: 'Gradle', weight: 2, alternatives: ['gradle'] },
          { name: 'Git', weight: 2, alternatives: ['git'] },
          { name: 'Docker', weight: 3, alternatives: ['docker'] },
        ],
      },
    ],
  },
  {
    name: 'Python 开发',
    keywords: ['python', 'django', 'flask', 'fastapi', '数据', 'data'],
    categories: [
      {
        name: 'Python 基础',
        level: 'beginner',
        skills: [
          { name: 'Python', weight: 3, alternatives: ['python3', 'py'] },
          { name: 'OOP', weight: 2, alternatives: ['面向对象'] },
        ],
      },
      {
        name: 'Web 框架',
        level: 'intermediate',
        skills: [
          { name: 'Django', weight: 5, alternatives: ['django'] },
          { name: 'Flask', weight: 4, alternatives: ['flask'] },
          { name: 'FastAPI', weight: 4, alternatives: ['fastapi'] },
        ],
      },
      {
        name: '数据科学',
        level: 'intermediate',
        skills: [
          { name: 'NumPy', weight: 3, alternatives: ['numpy'] },
          { name: 'Pandas', weight: 3, alternatives: ['pandas'] },
          { name: 'Matplotlib', weight: 2, alternatives: ['matplotlib'] },
        ],
      },
      {
        name: '机器学习',
        level: 'advanced',
        skills: [
          { name: 'Scikit-learn', weight: 3, alternatives: ['sklearn'] },
          { name: 'TensorFlow', weight: 4, alternatives: ['tensorflow'] },
          { name: 'PyTorch', weight: 4, alternatives: ['pytorch'] },
        ],
      },
      {
        name: '数据库',
        level: 'intermediate',
        skills: [
          { name: 'SQLAlchemy', weight: 3, alternatives: ['sqlalchemy'] },
          { name: 'MySQL', weight: 2, alternatives: ['mysql'] },
          { name: 'PostgreSQL', weight: 2, alternatives: ['postgresql'] },
          { name: 'MongoDB', weight: 2, alternatives: ['mongodb'] },
        ],
      },
      {
        name: '工具',
        level: 'intermediate',
        skills: [
          { name: 'Git', weight: 2, alternatives: ['git'] },
          { name: 'Docker', weight: 3, alternatives: ['docker'] },
          { name: 'pip', weight: 1, alternatives: ['pip', 'poetry', 'conda'] },
        ],
      },
    ],
  },
  {
    name: '全栈开发',
    keywords: ['全栈', 'fullstack', 'full-stack'],
    categories: [
      {
        name: '前端',
        level: 'intermediate',
        skills: [
          { name: 'React', weight: 4, alternatives: ['reactjs'] },
          { name: 'Vue', weight: 4, alternatives: ['vuejs'] },
          { name: 'TypeScript', weight: 3, alternatives: ['ts'] },
          { name: 'HTML/CSS', weight: 2, alternatives: ['html', 'css'] },
        ],
      },
      {
        name: '后端',
        level: 'intermediate',
        skills: [
          { name: 'Node.js', weight: 4, alternatives: ['node', 'express'] },
          { name: 'REST API', weight: 3, alternatives: ['restful'] },
          { name: 'GraphQL', weight: 3, alternatives: ['graphql'] },
        ],
      },
      {
        name: '数据库',
        level: 'intermediate',
        skills: [
          { name: 'PostgreSQL', weight: 3, alternatives: ['postgresql'] },
          { name: 'MongoDB', weight: 3, alternatives: ['mongodb'] },
          { name: 'Redis', weight: 2, alternatives: ['redis'] },
        ],
      },
      {
        name: '部署',
        level: 'intermediate',
        skills: [
          { name: 'Docker', weight: 3, alternatives: ['docker'] },
          { name: 'CI/CD', weight: 2, alternatives: ['github actions'] },
          { name: 'AWS', weight: 3, alternatives: ['aws', 'ec2', 's3'] },
          { name: 'Vercel', weight: 2, alternatives: ['vercel'] },
        ],
      },
    ],
  },
  {
    name: '产品经理',
    keywords: ['产品', 'product', 'pm', '产品经理'],
    categories: [
      {
        name: '产品基础',
        level: 'beginner',
        skills: [
          { name: '需求分析', weight: 4, alternatives: ['需求文档', 'prd'] },
          { name: '用户研究', weight: 3, alternatives: ['用研', 'user research'] },
          { name: '竞品分析', weight: 3, alternatives: ['竞品'] },
        ],
      },
      {
        name: '设计工具',
        level: 'intermediate',
        skills: [
          { name: 'Axure', weight: 3, alternatives: ['axure'] },
          { name: 'Figma', weight: 3, alternatives: ['figma'] },
          { name: 'Sketch', weight: 2, alternatives: ['sketch'] },
          { name: '墨刀', weight: 2, alternatives: ['modao'] },
        ],
      },
      {
        name: '数据分析',
        level: 'intermediate',
        skills: [
          { name: 'Excel', weight: 2, alternatives: ['excel'] },
          { name: 'SQL', weight: 3, alternatives: ['sql'] },
          { name: '数据埋点', weight: 3, alternatives: ['埋点'] },
        ],
      },
      {
        name: '项目管理',
        level: 'intermediate',
        skills: [
          { name: 'Jira', weight: 2, alternatives: ['jira'] },
          { name: 'Confluence', weight: 2, alternatives: ['confluence'] },
          { name: '敏捷开发', weight: 3, alternatives: ['scrum', 'agile'] },
        ],
      },
    ],
  },
  {
    name: 'UI/UX 设计',
    keywords: ['设计', 'design', 'ui', 'ux', '视觉'],
    categories: [
      {
        name: '设计基础',
        level: 'beginner',
        skills: [
          { name: '色彩理论', weight: 3, alternatives: ['配色'] },
          { name: '排版', weight: 3, alternatives: ['typography', '字体'] },
          { name: '交互设计', weight: 4, alternatives: ['interaction'] },
        ],
      },
      {
        name: '设计工具',
        level: 'intermediate',
        skills: [
          { name: 'Figma', weight: 5, alternatives: ['figma'] },
          { name: 'Sketch', weight: 3, alternatives: ['sketch'] },
          { name: 'Adobe XD', weight: 3, alternatives: ['xd'] },
          { name: 'Photoshop', weight: 3, alternatives: ['ps', 'photoshop'] },
          { name: 'Illustrator', weight: 3, alternatives: ['ai', 'illustrator'] },
        ],
      },
      {
        name: '前端基础',
        level: 'intermediate',
        skills: [
          { name: 'HTML', weight: 2, alternatives: ['html'] },
          { name: 'CSS', weight: 2, alternatives: ['css'] },
          { name: '响应式设计', weight: 3, alternatives: ['responsive'] },
        ],
      },
      {
        name: '设计系统',
        level: 'advanced',
        skills: [
          { name: 'Design System', weight: 4, alternatives: ['设计系统', 'design token'] },
          { name: '组件库', weight: 3, alternatives: ['component library'] },
          { name: '原型设计', weight: 3, alternatives: ['prototype'] },
        ],
      },
    ],
  },
]

/**
 * Find the best matching direction for a given target role.
 */
export function findDirection(targetRole: string): DirectionTaxonomy | null {
  const role = targetRole.toLowerCase()
  for (const direction of skillTaxonomy) {
    if (direction.keywords.some((kw) => role.includes(kw))) {
      return direction
    }
  }
  return null
}

/**
 * Get all known skill names (lowercased) for keyword matching.
 * Optionally filter by direction.
 */
export function getAllSkillNames(direction?: string): string[] {
  const names: string[] = []
  const directions = direction ? [findDirection(direction)].filter(Boolean) : skillTaxonomy

  for (const dir of directions) {
    if (!dir) continue
    for (const cat of dir.categories) {
      for (const skill of cat.skills) {
        names.push(skill.name.toLowerCase())
        for (const alt of skill.alternatives) {
          names.push(alt.toLowerCase())
        }
      }
    }
  }
  return names
}

/**
 * Find the weight of a skill by name (case-insensitive).
 * Returns 0 if not found.
 */
export function getSkillWeight(skillName: string, direction?: string): number {
  const lower = skillName.toLowerCase()
  const directions = direction ? [findDirection(direction)].filter(Boolean) : skillTaxonomy

  for (const dir of directions) {
    if (!dir) continue
    for (const cat of dir.categories) {
      for (const skill of cat.skills) {
        if (
          skill.name.toLowerCase() === lower ||
          skill.alternatives.some((alt) => alt.toLowerCase() === lower)
        ) {
          return skill.weight
        }
      }
    }
  }
  return 0
}
