import { Router, Request, Response } from 'express'
import { streamAI } from '../services/aiService'
import { buildCareerRoadmapPrompt } from '../prompts/careerRoadmapPrompt'

const router = Router()

// POST /api/career/roadmap/stream — SSE streaming
router.post('/roadmap/stream', async (req: Request, res: Response) => {
  try {
    const { skills, projects, targetRole, scoreBreakdown } = req.body

    const { system, user } = buildCareerRoadmapPrompt({
      skills: skills || [],
      projects: projects || [],
      targetRole: targetRole || '',
      scoreBreakdown: scoreBreakdown || undefined,
    })

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
    console.error('[career/roadmap/stream]', message)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message })
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
      res.end()
    }
  }
})

export default router
