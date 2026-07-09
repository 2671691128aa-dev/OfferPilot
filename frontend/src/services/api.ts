import type { ResumeFormData } from '../utils/storage'

// ─── Response Types ───

export interface DimensionScores {
  contentCompleteness: number
  jobMatch: number
  keywordCoverage: number
}

export interface GeneratedResume {
  summary: string
  skills: string[]
  projects: Array<{
    title: string
    description: string
    technology: string[]
  }>
  score: number
  dimensionScores: DimensionScores
  advice: string[]
}

export interface OptimizeResult {
  score: number
  advantages: string[]
  problems: string[]
  suggestions: string[]
}

export interface AnalyzeResult {
  matchScore: number
  requiredSkills: string[]
  advantages: string[]
  gaps: string[]
}

// ─── API Helpers ───

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('网络连接失败，请检查网络后重试')
  }

  let json: Record<string, unknown>
  try {
    json = await res.json()
  } catch {
    throw new Error(`服务器返回了无效响应 (HTTP ${res.status})，请稍后重试`)
  }

  if (!res.ok || !json.success) {
    throw new Error((json.message as string) || 'AI 服务异常，请稍后重试')
  }

  return json.data as T
}

// ─── Streaming endpoint URLs ───

export const STREAM_ENDPOINTS = {
  resumeGenerate: '/api/resume/generate/stream',
  resumeOptimize: '/api/resume/optimize/stream',
  jobAnalyze: '/api/job/analyze/stream',
  projectOptimize: '/api/project/optimize/stream',
} as const

// ─── API Functions ───

export function generateResume(data: ResumeFormData): Promise<GeneratedResume> {
  return apiPost<GeneratedResume>('/api/resume/generate', {
    name: data.profile.name,
    email: data.profile.email,
    location: data.profile.location,
    education: data.education,
    skills: data.skills,
    projects: data.projects,
    targetRole: data.targetRole,
  })
}

export function optimizeResume(resumeText: string, targetRole?: string): Promise<OptimizeResult> {
  return apiPost<OptimizeResult>('/api/resume/optimize', {
    resumeText,
    targetRole,
  })
}

export function analyzeJD(jdText: string, userSkills: string[]): Promise<AnalyzeResult> {
  return apiPost<AnalyzeResult>('/api/job/analyze', {
    jd: jdText,
    userSkills,
  })
}

export interface ProjectOptimizeResult {
  optimizedDescription: string
}

export function optimizeProjectDescription(project: {
  name: string
  description: string
  technology: string
  role: string
}): Promise<ProjectOptimizeResult> {
  return apiPost<ProjectOptimizeResult>('/api/project/optimize', project)
}
