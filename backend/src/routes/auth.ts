import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware'

const JWT_SECRET = process.env.JWT_SECRET || 'offerpilot-dev-secret'
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json')

interface UserRecord {
  id: string
  username: string
  password: string
  createdAt: string
}

function readUsers(): UserRecord[] {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeUsers(users: UserRecord[]): void {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
}

const router = Router()

// 注册
router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ success: false, message: '用户名和密码不能为空' })
    return
  }

  if (username.length < 2 || username.length > 20) {
    res.status(400).json({ success: false, message: '用户名长度需在 2-20 个字符之间' })
    return
  }

  if (password.length < 6) {
    res.status(400).json({ success: false, message: '密码长度至少 6 个字符' })
    return
  }

  const users = readUsers()
  if (users.find((u) => u.username === username)) {
    res.status(409).json({ success: false, message: '用户名已存在' })
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser: UserRecord = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    username,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  writeUsers(users)

  const token = jwt.sign({ userId: newUser.id, username: newUser.username }, JWT_SECRET, {
    expiresIn: '7d',
  })

  res.json({ success: true, data: { token, user: { id: newUser.id, username: newUser.username } } })
})

// 登录
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ success: false, message: '用户名和密码不能为空' })
    return
  }

  const users = readUsers()
  const user = users.find((u) => u.username === username)
  if (!user) {
    res.status(401).json({ success: false, message: '用户名或密码错误' })
    return
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    res.status(401).json({ success: false, message: '用户名或密码错误' })
    return
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '7d',
  })

  res.json({ success: true, data: { token, user: { id: user.id, username: user.username } } })
})

// 获取当前用户
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { user: req.user } })
})

export default router
