import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import resumeRoutes from './routes/resume'
import jobRoutes from './routes/job'
import projectRoutes from './routes/project'
import scoringRoutes from './routes/scoring'
import careerRoutes from './routes/career'
import interviewRoutes from './routes/interview'
import authMiddleware from './middleware/authMiddleware'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: true }))

// Limit JSON body size to prevent abuse
app.use(express.json({ limit: '100kb' }))

app.get('/', (_req, res) => {
  res.json({ message: 'OfferPilot API running' })
})

// Auth routes (no middleware required)
app.use('/api/auth', authRoutes)

// All business routes require authentication
app.use(authMiddleware)

app.use('/api/resume', resumeRoutes)
app.use('/api/job', jobRoutes)
app.use('/api/project', projectRoutes)
app.use('/api/score', scoringRoutes)
app.use('/api/career', careerRoutes)
app.use('/api/interview', interviewRoutes)

app.listen(PORT, () => {
  console.log(`OfferPilot backend listening on port ${PORT}`)
})
