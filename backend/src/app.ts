import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import resumeRoutes from './routes/resume'
import resumeDataRoutes from './routes/resumeData'
import jobRoutes from './routes/job'
import projectRoutes from './routes/project'
import scoringRoutes from './routes/scoring'
import careerRoutes from './routes/career'
import interviewRoutes from './routes/interview'
import authMiddleware from './middleware/authMiddleware'

export function createApp() {
  const app = express()

  app.use(cors({ origin: true }))
  app.use(express.json({ limit: '100kb' }))

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
