import type { ResumeFormData } from '../utils/storage'

// ─── Response Types ───

export interface DimensionScores {
  contentCompleteness: number
  jobMatch: number
  keywordCoverage: number
}

export interface DimensionScore {
  score: number
  weight: number
  reasons: string[]
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
  scoreBreakdown?: ScoreBreakdown
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
  careerRoadmap: '/api/career/roadmap/stream',
  interviewEvaluate: '/api/interview/evaluate/stream',
  interviewReport: '/api/interview/report/stream',
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

// ─── Interview Types ───

export interface InterviewQuestion {
  id: number
  category: string
  question: string
  context: string
  expectedTopics: string[]
}

export interface InterviewFeedback {
  score: number
  strengths: string[]
  weaknesses: string[]
  suggestedImprovement: string
  strongExample: string
}

export interface InterviewAnswer {
  questionId: number
  question: string
  category: string
  userAnswer: string
  feedback: InterviewFeedback | null
}

export interface InterviewReport {
  overallScore: number
  questionScores: Array<{ questionId: number; score: number }>
  topStrengths: string[]
  keyImprovements: string[]
  practiceTopics: string[]
  summary: string
}

// ─── Interview API ───

export function fetchInterviewQuestions(
  targetRole: string,
  resumeData: {
    skills: string[]
    projects: Array<{ name: string; description: string; technology?: string; role?: string }>
    summary?: string
  },
): Promise<{ questions: InterviewQuestion[] }> {
  return apiPost<{ questions: InterviewQuestion[] }>('/api/interview/questions', {
    targetRole,
    resumeData,
  })
}
