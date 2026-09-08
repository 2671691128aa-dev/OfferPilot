import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabase'
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const router = Router()

// 注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' })
    }

    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ success: false, message: '用户名长度需在 2-20 个字符之间' })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少 6 个字符' })
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      return res.status(409).json({ success: false, message: '用户名已存在' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ username, password: hashedPassword })
      .select('id, username')
      .single()

    if (error) {
      console.error('[auth/register] Supabase error:', error)
      return res.status(500).json({ success: false, message: '注册失败，请稍后重试' })
    }

    const token = jwt.sign({ userId: newUser.id, username: newUser.username }, JWT_SECRET, {
      expiresIn: '7d',
    })

    res.json({
      success: true,
      data: { token, user: { id: newUser.id, username: newUser.username } },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '注册失败'
    console.error('[auth/register]', message)
    res.status(500).json({ success: false, message })
  }
})

// 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password')
      .eq('username', username)
      .single()

    if (error || !user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' })
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    })

    res.json({
      success: true,
      data: { token, user: { id: user.id, username: user.username } },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '登录失败'
    console.error('[auth/login]', message)
    res.status(500).json({ success: false, message })
  }
})

// 获取当前用户
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { user: req.user } })
})

export default router
