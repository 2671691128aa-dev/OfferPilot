import { Router, Request, Response } from 'express'
import { optimizeProject, streamAI } from '../services/aiService'
import { buildProjectOptimizePrompt } from '../prompts/projectPrompt'

const router = Router()

// POST /api/project/optimize — non-streaming
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    const { name, description, technology, role } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: '项目名称不能为空' })
    }

    const { system, user } = buildProjectOptimizePrompt({
      name,
      description: description || '',
      technology: technology || '',
      role: role || '',
    })
    const result = await optimizeProject(system, user)
    const data = JSON.parse(result)

    return res.json({ success: true, data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI 服务异常'
    console.error('[project/optimize]', message)
    return res.status(500).json({ success: false, message })
  }
})

// POST /api/project/optimize/stream — SSE streaming
router.post('/optimize/stream', async (req: Request, res: Response) => {
  try {
    const { name, description, technology, role } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: '项目名称不能为空' })
    }

    const { system, user } = buildProjectOptimizePrompt({
      name,
      description: description || '',
      technology: technology || '',
      role: role || '',
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
    console.error('[project/optimize/stream]', message)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message })
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
      res.end()
    }
  }
})

export default router
