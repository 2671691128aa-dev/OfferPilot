import request from 'supertest'
import { createApp } from '../app'

const app = createApp()

describe('Auth API', () => {
  const testUser = { username: `test_${Date.now()}`, password: 'test123456' }
  let token: string

  it('POST /api/auth/register — should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.user.username).toBe(testUser.username)
    token = res.body.data.token
  })

  it('POST /api/auth/register — should reject duplicate username', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser)

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  it('POST /api/auth/register — should reject short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'newuser', password: '123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('POST /api/auth/register — should reject short username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'a', password: 'test123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('POST /api/auth/login — should login with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send(testUser)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeDefined()
    token = res.body.data.token
  })

  it('POST /api/auth/login — should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('POST /api/auth/login — should reject non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nonexistent', password: 'test123' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('GET /api/auth/me — should return user with valid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.user.username).toBe(testUser.username)
  })

  it('GET /api/auth/me — should reject without token', async () => {
    const res = await request(app).get('/api/auth/me')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('POST protected route — should reject without auth', async () => {
    const res = await request(app).post('/api/resume/generate').send({ name: 'test' })

    expect(res.status).toBe(401)
  })
})
