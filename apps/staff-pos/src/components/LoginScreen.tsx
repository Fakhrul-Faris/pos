'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { fade, spring } from '@/lib/motion'
import { useStore } from '../data/store'

export function LoginScreen() {
  const { login } = useStore()
  const [email, setEmail] = useState('shop@miki.app')
  const [password, setPassword] = useState('demo')
  const [stayLoggedIn, setStayLoggedIn] = useState(true)

  return (
    <motion.div
      className="flex min-h-dvh items-center justify-center bg-linen p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fade.soft}
    >
      <motion.div
        className="w-full max-w-sm rounded-2xl border border-fog bg-paper-white p-8 shadow-panel"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={spring.gentle}
      >
        <p className="text-xs font-medium tracking-ui text-ash">Staff POS</p>
        <h1 className="font-display mt-2 text-2xl font-medium tracking-ui text-carbon">Shop login</h1>
        <p className="mt-2 text-sm text-ash">Start terminal session for this device.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            login()
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs text-ash">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ash">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon outline-none focus:border-lavender"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-graphite">
            <input
              type="checkbox"
              checked={stayLoggedIn}
              onChange={(e) => setStayLoggedIn(e.target.checked)}
              className="rounded border-fog"
            />
            Stay logged in on this tablet
          </label>
          <button type="submit" className="btn-primary w-full px-4 py-2.5">
            Start session
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}
