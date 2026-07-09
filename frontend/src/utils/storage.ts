export interface UserProfile {
  name: string
  email: string
  location: string
}

export interface EducationData {
  school: string
  major: string
  degree: string
  startDate: string
  endDate: string
}

export interface ProjectData {
  name: string
  description: string
  technology: string
  role: string
}

export interface ResumeFormData {
  profile: UserProfile
  education: EducationData
  skills: string[]
  projects: ProjectData[]
  targetRole: string
}

const STORAGE_KEY = 'offerpilot_user'
const TEMPLATE_KEY = 'offerpilot_template'

export function loadResumeData(): ResumeFormData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return migrateData(JSON.parse(raw))
    }
  } catch {
    // ignore corrupt data
  }
  return getDefaultFormData()
}

export function saveResumeData(data: ResumeFormData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function clearResumeData(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getDefaultFormData(): ResumeFormData {
  return {
    profile: { name: '', email: '', location: '' },
    education: { school: '', major: '', degree: '', startDate: '', endDate: '' },
    skills: [],
    projects: [],
    targetRole: '',
  }
}

/**
 * Migrate old localStorage data to current schema.
 * Handles data from any previous version.
 */
export function migrateData(raw: unknown): ResumeFormData {
  const defaults = getDefaultFormData()
  if (!raw || typeof raw !== 'object') return defaults

  const obj = raw as Record<string, unknown>

  // Very old format: flat structure with name at top level
  if (typeof obj.name === 'string' && !obj.profile) {
    return {
      ...defaults,
      profile: {
        name: obj.name || '',
        email: (obj.email as string) || '',
        location: (obj.location as string) || '',
      },
      education: {
        school: (obj.school as string) || '',
        major: (obj.major as string) || '',
        degree: (obj.degree as string) || '',
        startDate: (obj.startDate as string) || '',
        endDate: (obj.endDate as string) || '',
      },
      skills: Array.isArray(obj.skills) ? obj.skills : [],
      projects: Array.isArray(obj.projects) ? obj.projects : [],
      targetRole: (obj.targetRole as string) || '',
    }
  }

  const profile =
    obj.profile && typeof obj.profile === 'object' ? (obj.profile as Record<string, unknown>) : {}
  const education =
    obj.education && typeof obj.education === 'object'
      ? (obj.education as Record<string, unknown>)
      : {}

  return {
    profile: {
      name: (profile.name as string) || '',
      email: (profile.email as string) || '',
      location: (profile.location as string) || '',
    },
    education: {
      school: (education.school as string) || (profile.school as string) || '',
      major: (education.major as string) || (profile.major as string) || '',
      degree: (education.degree as string) || '',
      startDate: (education.startDate as string) || '',
      endDate: (education.endDate as string) || '',
    },
    skills: Array.isArray(obj.skills) ? (obj.skills as string[]) : [],
    projects: Array.isArray(obj.projects) ? (obj.projects as ResumeFormData['projects']) : [],
    targetRole: (obj.targetRole as string) || '',
  }
}

// ─── Template preference ───

export type TemplateType = 'developer' | 'student'

export function loadTemplate(): TemplateType {
  const raw = localStorage.getItem(TEMPLATE_KEY)
  if (raw === 'developer' || raw === 'student') return raw
  return 'developer'
}

export function saveTemplate(template: TemplateType): void {
  localStorage.setItem(TEMPLATE_KEY, template)
}

// ─── AI Resume Version History ───

const VERSIONS_KEY = 'offerpilot_versions'

export interface ResumeVersion {
  id: string
  label: string
  timestamp: number
  data: {
    summary: string
    skills: string[]
    projects: Array<{ title: string; description: string; technology: string[] }>
    score: number
    dimensionScores: {
      contentCompleteness: number
      jobMatch: number
      keywordCoverage: number
    }
    advice: string[]
  }
}

export function loadVersions(): ResumeVersion[] {
  try {
    const raw = localStorage.getItem(VERSIONS_KEY)
    if (raw) return JSON.parse(raw) as ResumeVersion[]
  } catch {
    // ignore
  }
  return []
}

export function saveVersion(version: Omit<ResumeVersion, 'id' | 'timestamp'>): ResumeVersion {
  const versions = loadVersions()
  const newVersion: ResumeVersion = {
    ...version,
    id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  }
  versions.unshift(newVersion)
  // Keep max 10 versions
  if (versions.length > 10) versions.length = 10
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions))
  return newVersion
}

export function deleteVersion(id: string): void {
  const versions = loadVersions().filter((v) => v.id !== id)
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions))
}
