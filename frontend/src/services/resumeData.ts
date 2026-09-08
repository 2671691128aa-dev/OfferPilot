import { getToken } from './auth'
import type { ResumeFormData, ResumeVersion, TemplateType } from '../utils/storage'

async function apiGet<T>(url: string): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { headers })
  const json = await res.json()

  if (!res.ok || !json.success) {
    throw new Error((json.message as string) || '请求失败')
  }

  return json.data as T
}

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const json = await res.json()

  if (!res.ok || !json.success) {
    throw new Error((json.message as string) || '请求失败')
  }

  return json.data as T
}

async function apiDelete<T>(url: string): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { method: 'DELETE', headers })
  const json = await res.json()

  if (!res.ok || !json.success) {
    throw new Error((json.message as string) || '请求失败')
  }

  return json.data as T
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

// Resume form data
export async function fetchResumeData(): Promise<ResumeFormData | null> {
  try {
    const result = await apiGet<{
      profile: unknown
      education: unknown
      skills: string[]
      projects: unknown[]
      targetRole: string
    }>(`${API_BASE}/api/resume/data`)
    return result as unknown as ResumeFormData | null
  } catch {
    return null
  }
}

export async function saveResumeDataToServer(data: ResumeFormData): Promise<void> {
  await apiPost(`${API_BASE}/api/resume/data`, data)
}

// Version history
export async function fetchVersions(): Promise<ResumeVersion[]> {
  try {
    const result = await apiGet<{ versions: ResumeVersion[] }>(`${API_BASE}/api/resume/versions`)
    return result.versions
  } catch {
    return []
  }
}

export async function saveVersionToServer(
  label: string,
  data: ResumeVersion['data'],
): Promise<ResumeVersion> {
  const result = await apiPost<{ version: ResumeVersion }>(`${API_BASE}/api/resume/versions`, {
    label,
    data,
  })
  return result.version
}

export async function deleteVersionFromServer(id: string): Promise<void> {
  await apiDelete(`${API_BASE}/api/resume/versions/${id}`)
}

// Template preference
export async function fetchTemplate(): Promise<TemplateType> {
  try {
    const result = await apiGet<{ template: TemplateType }>(`${API_BASE}/api/resume/preferences`)
    return result.template
  } catch {
    return 'developer'
  }
}

export async function saveTemplateToServer(template: TemplateType): Promise<void> {
  await apiPost(`${API_BASE}/api/resume/preferences`, { template })
}
