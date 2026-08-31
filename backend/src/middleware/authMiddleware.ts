import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'offerpilot-dev-secret'

export interface AuthRequest extends Request {
  user?: { userId: string; username: string }
}

export default function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: '未登录，请先登录' })
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; username: string }
    req.user = payload
    next()
  } catch {
    res.status(401).json({ success: false, message: '登录已过期，请重新登录' })
  }
}
