import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import resumeRoutes from './routes/resume'
import jobRoutes from './routes/job'
import projectRoutes from './routes/project'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Production CORS: allow Vercel frontend + localhost
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://offer-pilot.vercel.app', // replace with your actual Vercel URL
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') return callback(null, true)
      callback(new Error(`CORS blocked: ${origin}`))
    },
  }),
)

// Limit JSON body size to prevent abuse
app.use(express.json({ limit: '100kb' }))

app.get('/', (_req, res) => {
  res.json({ message: 'OfferPilot API running' })
})

app.use('/api/resume', resumeRoutes)
app.use('/api/job', jobRoutes)
app.use('/api/project', projectRoutes)

app.listen(PORT, () => {
  console.log(`OfferPilot backend listening on port ${PORT}`)
})
