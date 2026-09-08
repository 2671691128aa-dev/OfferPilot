import request from 'supertest'
import { createApp } from '../app'

const app = createApp()

describe('Resume API', () => {
  let token: string

  beforeAll(async () => {
    const username = `rt_${Date.now()}`
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'test123456' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    token = res.body.data.token
  })

  it('POST /api/resume/generate — should reject missing name', async () => {
    const res = await request(app)
      .post('/api/resume/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ skills: ['React'], projects: [] })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('POST /api/resume/generate — should reject without auth', async () => {
    const res = await request(app).post('/api/resume/generate').send({ name: '测试用户' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('POST /api/resume/optimize — should reject empty resume text', async () => {
    const res = await request(app)
      .post('/api/resume/optimize')
      .set('Authorization', `Bearer ${token}`)
      .send({ resumeText: '' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})
