import dotenv from 'dotenv'
import { createApp } from './app'

dotenv.config()

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required')
  process.exit(1)
}

const app = createApp()
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`OfferPilot backend listening on port ${PORT}`)
})
