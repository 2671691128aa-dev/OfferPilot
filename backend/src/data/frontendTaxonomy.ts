/**
 * Frontend skill taxonomy — used by the rule-based scoring engine.
 * Each skill has a weight (importance) and level (difficulty tier).
 * Alternatives are synonyms / related terms that count as the same skill.
 */

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

export const frontendTaxonomy: SkillCategory[] = [
  {
    name: '基础语言',
    level: 'beginner',
    skills: [
      { name: 'HTML', weight: 1, alternatives: ['html5', 'html/css'] },
      { name: 'CSS', weight: 1, alternatives: ['css3', 'css animation', 'flexbox', 'grid'] },
      { name: 'JavaScript', weight: 2, alternatives: ['js', 'es6', 'es2015', 'ecmascript'] },
    ],
  },
  {
    name: '框架',
    level: 'intermediate',
    skills: [
      { name: 'React', weight: 5, alternatives: ['reactjs', 'react.js', 'react hooks'] },
      { name: 'Vue', weight: 5, alternatives: ['vuejs', 'vue.js', 'vue3', 'vue2'] },
      { name: 'Angular', weight: 5, alternatives: ['angularjs', 'angular.js'] },
      { name: 'Next.js', weight: 5, alternatives: ['nextjs', 'next'] },
      { name: 'Nuxt', weight: 5, alternatives: ['nuxtjs', 'nuxt.js'] },
      { name: 'Svelte', weight: 4, alternatives: ['sveltejs', 'svelte.js', 'sveltekit'] },
    ],
  },
  {
    name: '类型系统',
    level: 'intermediate',
    skills: [{ name: 'TypeScript', weight: 3, alternatives: ['ts', 'typescript'] }],
  },
  {
    name: '构建工具',
    level: 'intermediate',
    skills: [
      { name: 'Webpack', weight: 2, alternatives: ['webpack5'] },
      { name: 'Vite', weight: 3, alternatives: ['vitejs'] },
      { name: 'ESLint', weight: 2, alternatives: ['eslint', 'lint'] },
      { name: 'Prettier', weight: 1, alternatives: ['prettier'] },
      { name: 'Babel', weight: 2, alternatives: ['babel'] },
      { name: 'npm', weight: 1, alternatives: ['yarn', 'pnpm', 'npm scripts', 'bun'] },
    ],
  },
  {
    name: '状态管理',
    level: 'advanced',
    skills: [
      { name: 'Redux', weight: 3, alternatives: ['redux toolkit', 'rtk', 'react-redux'] },
      { name: 'Zustand', weight: 3, alternatives: ['zustand'] },
      { name: 'Pinia', weight: 3, alternatives: ['pinia'] },
      { name: 'MobX', weight: 3, alternatives: ['mobx'] },
      { name: 'Vuex', weight: 2, alternatives: ['vuex'] },
      {
        name: 'React Query',
        weight: 3,
        alternatives: ['react-query', 'tanstack query', '@tanstack/react-query'],
      },
    ],
  },
  {
    name: 'CSS 工具',
    level: 'intermediate',
    skills: [
      { name: 'Tailwind CSS', weight: 3, alternatives: ['tailwind', 'tailwindcss'] },
      { name: 'Sass', weight: 2, alternatives: ['scss', 'sass'] },
      { name: 'CSS Modules', weight: 2, alternatives: ['css modules', 'cssmodules'] },
      {
        name: 'styled-components',
        weight: 2,
        alternatives: ['styled components', 'emotion', 'styled'],
      },
      { name: 'Ant Design', weight: 2, alternatives: ['antd', 'ant design', 'ant-design'] },
      {
        name: 'Element UI',
        weight: 2,
        alternatives: ['element-ui', 'elementui', 'element plus', 'element-plus'],
      },
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
      {
        name: 'Testing Library',
        weight: 3,
        alternatives: ['react testing library', 'rtl', '@testing-library'],
      },
    ],
  },
  {
    name: '性能优化',
    level: 'advanced',
    skills: [
      { name: 'Lighthouse', weight: 2, alternatives: ['lighthouse', 'web vitals'] },
      {
        name: 'Core Web Vitals',
        weight: 2,
        alternatives: ['web vitals', 'cls', 'lcp', 'fid', 'inp'],
      },
      {
        name: 'Lazy Loading',
        weight: 2,
        alternatives: ['lazy loading', 'code splitting', 'dynamic import'],
      },
      { name: 'SSR', weight: 3, alternatives: ['ssr', 'server side rendering', '服务端渲染'] },
      { name: 'SSG', weight: 2, alternatives: ['ssg', 'static site generation'] },
    ],
  },
  {
    name: '部署与工程化',
    level: 'intermediate',
    skills: [
      { name: 'Vercel', weight: 2, alternatives: ['vercel'] },
      { name: 'Netlify', weight: 2, alternatives: ['netlify'] },
      { name: 'Docker', weight: 3, alternatives: ['docker'] },
      {
        name: 'CI/CD',
        weight: 2,
        alternatives: ['ci/cd', 'github actions', 'gitlab ci', 'jenkins'],
      },
      { name: 'Git', weight: 2, alternatives: ['git'] },
      { name: 'Nginx', weight: 2, alternatives: ['nginx'] },
    ],
  },
  {
    name: '后端能力',
    level: 'advanced',
    skills: [
      {
        name: 'Node.js',
        weight: 4,
        alternatives: ['node', 'nodejs', 'express', 'koa', 'nest.js', 'nestjs'],
      },
      {
        name: 'REST API',
        weight: 3,
        alternatives: ['rest api', 'restful', 'restful api', 'api design'],
      },
      { name: 'GraphQL', weight: 3, alternatives: ['graphql', 'apollo'] },
      { name: 'WebSocket', weight: 3, alternatives: ['websocket', 'socket.io', 'ws'] },
      {
        name: '数据库',
        weight: 3,
        alternatives: ['mysql', 'mongodb', 'postgresql', 'sqlite', 'redis', 'supabase', 'firebase'],
      },
    ],
  },
]

/**
 * Get all known skill names (lowercased) for keyword matching.
 */
export function getAllSkillNames(): string[] {
  const names: string[] = []
  for (const cat of frontendTaxonomy) {
    for (const skill of cat.skills) {
      names.push(skill.name.toLowerCase())
      for (const alt of skill.alternatives) {
        names.push(alt.toLowerCase())
      }
    }
  }
  return names
}

/**
 * Find the weight of a skill by name (case-insensitive).
 * Returns 0 if not found.
 */
export function getSkillWeight(skillName: string): number {
  const lower = skillName.toLowerCase()
  for (const cat of frontendTaxonomy) {
    for (const skill of cat.skills) {
      if (
        skill.name.toLowerCase() === lower ||
        skill.alternatives.some((alt) => alt.toLowerCase() === lower)
      ) {
        return skill.weight
      }
    }
  }
  return 0
}
