'use client'

import { useState, type FormEvent } from 'react'
import { ADMINS, MOCK_ADMIN_PASSWORD } from '@/data/mock'
import type { AdminId } from '@/data/types'
import { Button } from '@/components/ui/Button'

type LoginProps = {
  onLogin: (id: AdminId) => void
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const completeLogin = (id: AdminId) => {
    setSubmitting(true)
    setError('')
    window.setTimeout(() => onLogin(id), 120)
  }

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
    completeLogin(admin.id)
  }

  /** One-click demo — avoids browser blocking programmatic password fills. */
  const signInAs = (id: AdminId) => {
    const admin = ADMINS.find((a) => a.id === id)
    if (!admin) return
    setEmail(admin.email)
    setPassword(MOCK_ADMIN_PASSWORD)
    completeLogin(admin.id)
  }

  return (
    <div className="login-stage relative flex min-h-dvh overflow-hidden bg-background">
      <div className="login-atmosphere pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-6 py-12 md:flex-row md:items-center md:gap-16 md:px-10">
        <div className="login-brand max-w-sm shrink-0 md:flex-1">
          <img
            src="/brand/miki-logo.png"
            alt="Miki"
            className="h-8 w-auto brightness-0 invert"
          />
          <h1 className="mt-8 text-4xl font-semibold tracking-ui text-foreground md:text-5xl">
            Miki Admin
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Internal ops console · Super Admin
          </p>
          <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-900">
            Mock · local only
          </p>
        </div>

        <div className="login-panel w-full max-w-md shrink-0">
          <div className="geist-panel p-7 md:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-900">
              Sign in
            </p>
            <h2 className="mt-1.5 text-xl font-semibold tracking-ui text-foreground">
              Continue to Admin
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Use your Miki staff email. Switch accounts to demo dual approval.
            </p>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <label className="block text-xs font-medium text-muted">
                Email
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@miki.my"
                  required
                  className="geist-input mt-1.5"
                />
              </label>

              <label className="block text-xs font-medium text-muted">
                Password
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="geist-input pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[6px] px-2 py-1 text-xs font-medium text-muted hover:bg-gray-200 hover:text-foreground"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-[6px] border border-red-700 bg-red-100 px-3 py-2 text-xs font-medium text-red-900"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                loading={submitting}
                className="mt-1 w-full"
                size="large"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray-900">
                Demo accounts
              </p>
              <p className="mt-1 text-xs text-muted">
                Click to sign in · password{' '}
                <code className="rounded-[6px] bg-gray-200 px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
                  {MOCK_ADMIN_PASSWORD}
                </code>
              </p>
              <div className="mt-3 flex flex-col gap-1">
                {ADMINS.map((admin, i) => (
                  <button
                    key={admin.id}
                    type="button"
                    disabled={submitting}
                    onClick={() => signInAs(admin.id)}
                    className="login-demo-row flex items-center gap-3 rounded-[6px] border border-transparent px-2.5 py-2 text-left transition hover:border-border hover:bg-gray-200 disabled:opacity-50"
                    style={{ animationDelay: `${100 + i * 50}ms` }}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground font-mono text-[11px] font-semibold text-background">
                      {admin.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {admin.name}
                      </span>
                      <span className="block truncate text-xs text-gray-900">
                        {admin.email}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-[6px] bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-muted">
                      Sign in
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
