import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err: any) {
      const serverMessage = err.response?.data?.message
      const errorMessage = serverMessage || err.message || 'Tên đăng nhập hoặc mật khẩu không đúng'
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-on-primary mx-auto mb-4 shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-3xl">functions</span>
          </div>
          <h1 className="text-3xl font-black font-headline text-on-surface tracking-tight">MATH CENTER</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Logic of Clarity</p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/10">
          <h2 className="text-xl font-bold font-headline text-on-surface mb-6">Đăng nhập hệ thống</h2>

          {error && (
            <div className="mb-4 p-3 bg-error-container/10 text-error rounded-xl text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-dim transition-all shadow-lg shadow-primary/25 active:scale-95 disabled:opacity-60 text-sm font-headline tracking-wide"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-outline mt-6">
          Math Center Management System &copy; 2024
        </p>
      </div>
    </div>
  )
}
