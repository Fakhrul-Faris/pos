'use client'

import { useState, type FormEvent } from 'react'
import { ADMINS, MOCK_ADMIN_PASSWORD } from '@/data/mock'
import type { AdminId } from '@/data/types'

type LoginProps = {
  onLogin: (id: AdminId) => void
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const normalized = email.trim().toLowerCase()
    const admin = ADMINS.find((a) => a.email.toLowerCase() === normalized)
    if (!admin) {
      setError('No Super Admin account for that email.')
      return
    }
    if (password !== MOCK_ADMIN_PASSWORD) {
      setError('Incorrect password.')
      return
    }
    setSubmitting(true)
    // Brief delay so the press state reads as intentional
    window.setTimeout(() => onLogin(admin.id), 180)
  }

  const fillDemo = (id: AdminId) => {
    const admin = ADMINS.find((a) => a.id === id)
    if (!admin) return
    setEmail(admin.email)
    setPassword(MOCK_ADMIN_PASSWORD)
    setError('')
  }

  return (
    <div className="login-stage relative flex min-h-dvh overflow-hidden bg-carbon">
      <div className="login-atmosphere pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-6 py-12 md:flex-row md:items-center md:gap-16 md:px-10">
        {/* Brand */}
        <div className="login-brand max-w-sm shrink-0 md:flex-1">
          <img
            src="/brand/miki-logo.png"
            alt="Miki"
            className="h-8 w-auto brightness-0 invert"
          />
          <h1 className="mt-8 text-4xl font-semibold tracking-ui text-paper-white md:text-5xl">
            Miki Admin
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/55">
            Internal ops console · Super Admin
          </p>
          <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.16em] text-white/35">
            Mock · local only
          </p>
        </div>

        {/* Form panel */}
        <div className="login-panel w-full max-w-md shrink-0">
          <div className="rounded-2xl bg-paper-white p-7 shadow-panel md:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ash">
              Sign in
            </p>
            <h2 className="mt-1.5 text-xl font-semibold tracking-ui text-carbon">
              Continue to Admin
            </h2>
            <p className="mt-1.5 text-sm text-graphite">
              Use your Miki staff email. Switch accounts to demo dual approval.
            </p>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <label className="block text-xs font-medium text-ash">
                Email
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@miki.my"
                  required
                  className="mt-1.5 w-full rounded-lg border border-fog bg-linen px-3.5 py-2.5 text-sm text-carbon outline-none transition placeholder:text-ash/70 focus:border-carbon focus:bg-paper-white focus:ring-2 focus:ring-carbon/10"
                />
              </label>

              <label className="block text-xs font-medium text-ash">
                Password
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-lg border border-fog bg-linen px-3.5 py-2.5 pr-16 text-sm text-carbon outline-none transition placeholder:text-ash/70 focus:border-carbon focus:bg-paper-white focus:ring-2 focus:ring-carbon/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-graphite hover:bg-mist hover:text-carbon"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-[#ffe8e0] px-3 py-2 text-xs font-medium text-ember"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 rounded-full bg-carbon px-5 py-3 text-sm font-medium text-paper-white shadow-btn transition hover:bg-carbon/90 disabled:opacity-60"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 border-t border-fog pt-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-ash">
                Demo accounts
              </p>
              <p className="mt-1 text-xs text-graphite">
                Password for all: <code className="rounded bg-mist px-1.5 py-0.5 font-medium text-carbon">{MOCK_ADMIN_PASSWORD}</code>
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                {ADMINS.map((admin, i) => (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() => fillDemo(admin.id)}
                    className="login-demo-row flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 text-left transition hover:border-fog hover:bg-mist"
                    style={{ animationDelay: `${120 + i * 60}ms` }}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-carbon text-[11px] font-semibold text-paper-white">
                      {admin.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-carbon">
                        {admin.name}
                      </span>
                      <span className="block truncate text-xs text-ash">
                        {admin.email}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-mist px-2 py-0.5 text-[10px] font-medium text-graphite">
                      Super Admin
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
