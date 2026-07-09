import { Router, Request, Response } from 'express'
import { generateResume, optimizeResume, streamAI } from '../services/aiService'
import { buildResumePrompt } from '../prompts/resumePrompt'
import { buildOptimizePrompt } from '../prompts/optimizePrompt'

const router = Router()

// POST /api/resume/generate — non-streaming (fallback)
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { name, email, location, education, skills, projects, targetRole } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: '姓名不能为空' })
    }

    const { system, user } = buildResumePrompt({
      name,
      email,
      location: location || '',
      education: education || { school: '', major: '', degree: '', startDate: '', endDate: '' },
      skills: skills || [],
      projects: projects || [],
      targetRole: targetRole || '',
    })
    const result = await generateResume(system, user)
    const data = JSON.parse(result)

    return res.json({ success: true, data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI 服务异常'
    console.error('[resume/generate]', message)
    return res.status(500).json({ success: false, message })
  }
})

// POST /api/resume/generate/stream — SSE streaming
router.post('/generate/stream', async (req: Request, res: Response) => {
  try {
    const { name, email, location, education, skills, projects, targetRole } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: '姓名不能为空' })
    }

    const { system, user } = buildResumePrompt({
      name,
      email,
      location: location || '',
      education: education || { school: '', major: '', degree: '', startDate: '', endDate: '' },
      skills: skills || [],
      projects: projects || [],
      targetRole: targetRole || '',
    })

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    let fullText = ''

    for await (const chunk of streamAI(system, user)) {
      fullText += chunk
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
    }

    // Parse and validate the final JSON, then send as the done event
    try {
      const data = JSON.parse(fullText.trim())
      res.write(`data: ${JSON.stringify({ type: 'done', data })}\n\n`)
    } catch {
      res.write(
        `data: ${JSON.stringify({ type: 'error', message: 'AI 返回的 JSON 格式无效' })}\n\n`,
      )
    }

    res.end()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI 服务异常'
    console.error('[resume/generate/stream]', message)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message })
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
      res.end()
    }
  }
})

// POST /api/resume/optimize — non-streaming (fallback)
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    const { resumeText, targetRole } = req.body

    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ success: false, message: '简历内容不能为空' })
    }

    const { system, user } = buildOptimizePrompt(resumeText, targetRole)
    const result = await optimizeResume(system, user)
    const data = JSON.parse(result)

    return res.json({ success: true, data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI 服务异常'
    console.error('[resume/optimize]', message)
    return res.status(500).json({ success: false, message })
  }
})

// POST /api/resume/optimize/stream — SSE streaming
router.post('/optimize/stream', async (req: Request, res: Response) => {
  try {
    const { resumeText, targetRole } = req.body

    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ success: false, message: '简历内容不能为空' })
    }

    const { system, user } = buildOptimizePrompt(resumeText, targetRole)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    let fullText = ''

    for await (const chunk of streamAI(system, user)) {
      fullText += chunk
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
    }

    try {
      const data = JSON.parse(fullText.trim())
      res.write(`data: ${JSON.stringify({ type: 'done', data })}\n\n`)
    } catch {
      res.write(
        `data: ${JSON.stringify({ type: 'error', message: 'AI 返回的 JSON 格式无效' })}\n\n`,
      )
    }

    res.end()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI 服务异常'
    console.error('[resume/optimize/stream]', message)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message })
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
      res.end()
    }
  }
})

export default router
