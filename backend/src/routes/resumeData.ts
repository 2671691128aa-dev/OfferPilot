import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'
import { AuthRequest } from '../middleware/authMiddleware'

const router = Router()

// GET /api/resume/data — 读取当前用户的简历表单数据
router.get('/data', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const { data, error } = await supabase
      .from('resumes')
      .select('profile, education, skills, projects, target_role, updated_at')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[resumeData/get]', error)
      return res.status(500).json({ success: false, message: '获取简历数据失败' })
    }

    if (!data) {
      return res.json({ success: true, data: null })
    }

    res.json({
      success: true,
      data: {
        profile: data.profile,
        education: data.education,
        skills: data.skills,
        projects: data.projects,
        targetRole: data.target_role,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取简历数据失败'
    console.error('[resumeData/get]', message)
    res.status(500).json({ success: false, message })
  }
})

// POST /api/resume/data — 保存/更新简历表单数据
router.post('/data', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { profile, education, skills, projects, targetRole } = req.body

    const { error } = await supabase.from('resumes').upsert(
      {
        user_id: userId,
        profile: profile || {},
        education: education || {},
        skills: skills || [],
        projects: projects || [],
        target_role: targetRole || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      console.error('[resumeData/save]', error)
      return res.status(500).json({ success: false, message: '保存简历数据失败' })
    }

    res.json({ success: true, data: { message: '保存成功' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '保存简历数据失败'
    console.error('[resumeData/save]', message)
    res.status(500).json({ success: false, message })
  }
})

// GET /api/resume/versions — 获取版本列表
router.get('/versions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const { data, error } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[resumeData/versions]', error)
      return res.status(500).json({ success: false, message: '获取版本列表失败' })
    }

    const versions = (data || []).map(
      (v: { id: string; label: string; data: unknown; created_at: string }) => ({
        id: v.id,
        label: v.label,
        timestamp: new Date(v.created_at).getTime(),
        data: v.data,
      }),
    )

    res.json({ success: true, data: { versions } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取版本列表失败'
    console.error('[resumeData/versions]', message)
    res.status(500).json({ success: false, message })
  }
})

// POST /api/resume/versions — 保存新版本
router.post('/versions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { label, data: versionData } = req.body

    // Cap at 10 versions
    const { count } = await supabase
      .from('resume_versions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (count && count >= 10) {
      const { data: oldest } = await supabase
        .from('resume_versions')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (oldest) {
        await supabase.from('resume_versions').delete().eq('id', oldest.id)
      }
    }

    const { data: newVersion, error } = await supabase
      .from('resume_versions')
      .insert({ user_id: userId, label: label || 'AI 生成版本', data: versionData })
      .select('*')
      .single()

    if (error) {
      console.error('[resumeData/saveVersion]', error)
      return res.status(500).json({ success: false, message: '保存版本失败' })
    }

    const version = {
      id: newVersion.id,
      label: newVersion.label,
      timestamp: new Date(newVersion.created_at).getTime(),
      data: newVersion.data,
    }

    res.json({ success: true, data: { version } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '保存版本失败'
    console.error('[resumeData/saveVersion]', message)
    res.status(500).json({ success: false, message })
  }
})

// DELETE /api/resume/versions/:id — 删除版本
router.delete('/versions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const { error } = await supabase
      .from('resume_versions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('[resumeData/deleteVersion]', error)
      return res.status(500).json({ success: false, message: '删除版本失败' })
    }

    res.json({ success: true, data: { message: '删除成功' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '删除版本失败'
    console.error('[resumeData/deleteVersion]', message)
    res.status(500).json({ success: false, message })
  }
})

// GET /api/resume/preferences — 获取偏好
router.get('/preferences', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const { data, error } = await supabase
      .from('user_preferences')
      .select('template')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[resumeData/prefs]', error)
      return res.status(500).json({ success: false, message: '获取偏好失败' })
    }

    res.json({
      success: true,
      data: { template: data?.template || 'developer' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取偏好失败'
    console.error('[resumeData/prefs]', message)
    res.status(500).json({ success: false, message })
  }
})

// POST /api/resume/preferences — 更新偏好
router.post('/preferences', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { template } = req.body

    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, template: template || 'developer' }, { onConflict: 'user_id' })

    if (error) {
      console.error('[resumeData/prefs/save]', error)
      return res.status(500).json({ success: false, message: '保存偏好失败' })
    }

    res.json({ success: true, data: { message: '保存成功' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '保存偏好失败'
    console.error('[resumeData/prefs/save]', message)
    res.status(500).json({ success: false, message })
  }
})

export default router
