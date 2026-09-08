import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth'
import resumeRoutes from './routes/resume'
import resumeDataRoutes from './routes/resumeData'
import jobRoutes from './routes/job'
import projectRoutes from './routes/project'
import scoringRoutes from './routes/scoring'
import careerRoutes from './routes/career'
import interviewRoutes from './routes/interview'
import authMiddleware from './middleware/authMiddleware'

const ALLOWED_ORIGINS = [
  'https://offer-pilot-1.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

export function createApp() {
  const app = express()

  app.use(cors({ origin: ALLOWED_ORIGINS }))
  app.use(express.json({ limit: '100kb' }))

  // General API rate limit
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: '请求过于频繁，请稍后再试' },
  })
  app.use(generalLimiter)

  // Stricter rate limit for auth routes
  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: '登录尝试过于频繁，请1分钟后再试' },
  })
  app.use('/api/auth', authLimiter)

  app.get('/', (_req, res) => {
    res.json({ message: 'OfferPilot API running' })
  })

  app.use('/api/auth', authRoutes)
  app.use(authMiddleware)
  app.use('/api/resume', resumeRoutes)
  app.use('/api/resume', resumeDataRoutes)
  app.use('/api/job', jobRoutes)
  app.use('/api/project', projectRoutes)
  app.use('/api/score', scoringRoutes)
  app.use('/api/career', careerRoutes)
  app.use('/api/interview', interviewRoutes)

  return app
}
