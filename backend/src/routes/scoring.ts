import { Router, Request, Response } from 'express'
import { scoreResume, type ScoringInput } from '../services/scoringEngine'

const router = Router()

/**
 * POST /api/score/resume
 * Rule-based resume scoring — no AI involved, instant response.
 */
router.post('/resume', (req: Request, res: Response) => {
  try {
    const { projects, skills, targetRole, summary, hasEmail, hasEducation } =
      req.body as ScoringInput & { hasEmail?: boolean; hasEducation?: boolean }

    // Build the full resume text from all available content
    const resumeText = [
      summary || '',
      ...(projects || []).map(
        (p: { name: string; description: string; technology: string; role: string }) =>
          `${p.name} ${p.description} ${p.technology} ${p.role}`,
      ),
      (skills || []).join(' '),
    ].join(' ')

    const result = scoreResume({
      resumeText,
      projects: projects || [],
      skills: skills || [],
      targetRole: targetRole || '',
      summary: summary || '',
      hasEmail: !!hasEmail,
      hasEducation: !!hasEducation,
    })

    return res.json({ success: true, data: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '评分服务异常'
    console.error('[score/resume]', message)
    return res.status(500).json({ success: false, message })
  }
})

export default router
