import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../services/auth'

type Mode = 'login' | 'register'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        await register(username, password)
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light shadow-lg shadow-primary/20">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m0 0a14.926 14.926 0 0 1-5.395-.796"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ink">OfferPilot</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {mode === 'login' ? '登录你的账号' : '创建新账号'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-white p-8 shadow-sm">
          {/* Tabs */}
          <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === 'login' ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === 'register'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-ink">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
                minLength={2}
                maxLength={20}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? '请输入密码' : '至少 6 个字符'}
                required
                minLength={mode === 'register' ? 6 : undefined}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-shine w-full rounded-lg bg-gradient-to-r from-primary to-primary-light py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 transition hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60"
            >
              {loading ? '请稍候...' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-muted">
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
            <button
              type="button"
              onClick={switchMode}
              className="ml-1 font-medium text-primary hover:underline"
            >
              {mode === 'login' ? '去注册' : '去登录'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
