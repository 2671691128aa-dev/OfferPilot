import { Router, Request, Response } from 'express'
import { analyzeJD, streamAI } from '../services/aiService'
import { buildJDPrompt } from '../prompts/jdPrompt'

const router = Router()

// POST /api/job/analyze — non-streaming
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { jd, userSkills } = req.body

    if (!jd || !jd.trim()) {
      return res.status(400).json({ success: false, message: '岗位描述不能为空' })
    }

    const { system, user } = buildJDPrompt(jd, userSkills || [])
    const result = await analyzeJD(system, user)
    const data = JSON.parse(result)

    return res.json({ success: true, data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI 服务异常'
    console.error('[job/analyze]', message)
    return res.status(500).json({ success: false, message })
  }
})

// POST /api/job/analyze/stream — SSE streaming
router.post('/analyze/stream', async (req: Request, res: Response) => {
  try {
    const { jd, userSkills } = req.body

    if (!jd || !jd.trim()) {
      return res.status(400).json({ success: false, message: '岗位描述不能为空' })
    }

    const { system, user } = buildJDPrompt(jd, userSkills || [])

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
    console.error('[job/analyze/stream]', message)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message })
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
      res.end()
    }
  }
})

export default router
