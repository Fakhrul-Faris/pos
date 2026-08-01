'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { fade, spring } from '@/lib/motion'
import { useStore } from '../data/store'

function FloorMark() {
  return (
    <svg
      viewBox="0 0 280 160"
      className="mt-10 w-full max-w-sm text-white/90"
      aria-hidden
    >
      <rect x="24" y="88" width="232" height="10" rx="2" fill="currentColor" opacity="0.25" />
      {[0, 1, 2].map((i) => {
        const x = 48 + i * 72
        return (
          <g key={i} transform={`translate(${x} 36)`}>
            <rect x="8" y="28" width="36" height="48" rx="6" fill="currentColor" opacity="0.35" />
            <rect x="0" y="68" width="52" height="8" rx="2" fill="currentColor" opacity="0.2" />
            <circle cx="26" cy="18" r="14" fill="currentColor" opacity="0.55" />
            <rect x="14" y="8" width="24" height="6" rx="2" fill="currentColor" opacity="0.35" />
          </g>
        )
      })}
      <g transform="translate(36 118)">
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={i * 52}
            y="0"
            width="40"
            height="22"
            rx="4"
            fill="currentColor"
            opacity={0.2 + i * 0.08}
          />
        ))}
      </g>
    </svg>
  )
}

export function LoginScreen() {
  const { login } = useStore()
  const [email, setEmail] = useState('shop@miki.app')
  const [password, setPassword] = useState('demo')
  const [stayLoggedIn, setStayLoggedIn] = useState(true)

  return (
    <motion.div
      className="flex min-h-dvh flex-col gap-3 p-3 lg:flex-row"
      style={{ backgroundColor: '#ffffff' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fade.soft}
    >
      <motion.section
        className="relative flex min-h-[42dvh] flex-1 flex-col justify-between overflow-hidden rounded-xl px-8 py-10 text-white sm:px-12 sm:py-14 lg:min-h-0 lg:max-w-[52%] lg:px-14 lg:py-16"
        style={{
          backgroundColor: '#0b3d91',
          backgroundImage:
            'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(255,255,255,0.14), transparent 55%), linear-gradient(160deg, #0b3d91 0%, #082e6e 48%, #061f4a 100%)',
        }}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={spring.gentle}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Miki</p>
          <h1 className="font-display mt-8 max-w-[12ch] text-[clamp(2.75rem,7vw,4.75rem)] font-semibold leading-[0.95] tracking-tight text-white">
            Queue.
            <br />
            Cut.
            <br />
            Clear.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
            Shared counter tablet for the floor — chairs, waiting, walk-ins, and pay. One device,
            every barber.
          </p>
        </div>
        <FloorMark />
      </motion.section>

      <motion.section
        className="flex flex-1 flex-col justify-center rounded-xl px-8 py-12 sm:px-12 lg:px-16 lg:py-16"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={spring.gentle}
      >
        <div className="mx-auto w-full max-w-sm">
          <p
            className="text-[10px] font-medium uppercase tracking-ui"
            style={{ color: '#888888' }}
          >
            Staff POS
          </p>
          <h2
            className="font-display mt-2 text-2xl font-medium tracking-ui"
            style={{ color: '#171717' }}
          >
            Shop login
          </h2>
          <p className="mt-2 text-sm" style={{ color: '#4d4d4d' }}>
            Start terminal session for this device.
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              login()
            }}
          >
            <label className="block">
              <span className="mb-1.5 block text-xs" style={{ color: '#888888' }}>
                Email address
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="username"
                className="w-full rounded-lg px-3.5 py-3 text-sm outline-none"
                style={{
                  color: '#171717',
                  backgroundColor: '#ffffff',
                  border: '1px solid #ebebeb',
                }}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs" style={{ color: '#888888' }}>
                Password
              </span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg px-3.5 py-3 text-sm outline-none"
                style={{
                  color: '#171717',
                  backgroundColor: '#ffffff',
                  border: '1px solid #ebebeb',
                }}
              />
            </label>
            <label className="flex items-center gap-2.5 text-sm" style={{ color: '#4d4d4d' }}>
              <input
                type="checkbox"
                checked={stayLoggedIn}
                onChange={(e) => setStayLoggedIn(e.target.checked)}
                className="h-4 w-4 rounded"
                style={{ accentColor: '#2c78fc' }}
              />
              Stay logged in on this tablet
            </label>
            <button
              type="submit"
              className="mt-2 w-full border-0 bg-transparent p-0"
              style={{ background: 'transparent', appearance: 'none' }}
            >
              <span
                className="flex w-full items-center justify-center text-sm font-semibold"
                style={{
                  minHeight: 48,
                  borderRadius: 9999,
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
                }}
              >
                Start session
              </span>
            </button>
          </form>

          <p className="mt-8 text-center text-[11px]" style={{ color: '#888888' }}>
            Demo · any password works
          </p>
        </div>
      </motion.section>
    </motion.div>
  )
}
