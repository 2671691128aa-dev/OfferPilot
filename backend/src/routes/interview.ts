import { Router, Request, Response } from 'express'
import { generateInterviewQuestions, streamAI } from '../services/aiService'
import {
  buildInterviewQuestionsPrompt,
  buildAnswerEvalPrompt,
  buildInterviewReportPrompt,
} from '../prompts/interviewPrompt'

const router = Router()

// POST /api/interview/questions — non-streaming (structured JSON)
router.post('/questions', async (req: Request, res: Response) => {
  try {
    const { targetRole, resumeData } = req.body

    if (!targetRole || !targetRole.trim()) {
      return res.status(400).json({ success: false, message: '请选择目标岗位' })
    }

    if (!resumeData || (!resumeData.skills?.length && !resumeData.projects?.length)) {
      return res.status(400).json({
        success: false,
        message: '请先填写个人信息和技能/项目经历',
      })
    }

    const { system, user } = buildInterviewQuestionsPrompt(targetRole, resumeData)
    const result = await generateInterviewQuestions(system, user)
    const data = JSON.parse(result)

    return res.json({ success: true, data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI 服务异常'
    console.error('[interview/questions]', message)
    return res.status(500).json({ success: false, message })
  }
})

// POST /api/interview/evaluate/stream — SSE streaming
router.post('/evaluate/stream', async (req: Request, res: Response) => {
  try {
    const { question, expectedTopics, userAnswer, targetRole } = req.body

    if (!userAnswer || !userAnswer.trim()) {
      return res.status(400).json({ success: false, message: '请输入回答内容' })
    }

    const { system, user } = buildAnswerEvalPrompt(
      question || '',
      expectedTopics || [],
      userAnswer,
      targetRole || '',
    )

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
    console.error('[interview/evaluate/stream]', message)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message })
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
      res.end()
    }
  }
})

// POST /api/interview/report/stream — SSE streaming
router.post('/report/stream', async (req: Request, res: Response) => {
  try {
    const { targetRole, questions, answers } = req.body

    if (!questions?.length || !answers?.length) {
      return res.status(400).json({ success: false, message: '缺少面试数据' })
    }

    const { system, user } = buildInterviewReportPrompt(targetRole || '', questions, answers)

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
    console.error('[interview/report/stream]', message)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message })
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
      res.end()
    }
  }
})

export default router
