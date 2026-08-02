'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { spring } from '@/motion/springs'

const SHOP = {
  name: 'Ali Barbershop',
  tagline: 'Book your slot',
  hours: '10:00 AM to 6:00 PM',
  address: 'SS12, Shah Alam',
}

type WelcomePageProps = {
  onBook: () => void
  onRetrieve: () => void
}

export function WelcomePage({ onBook, onRetrieve }: WelcomePageProps) {
  const [serving, setServing] = useState(38)

  useEffect(() => {
    const id = window.setInterval(() => {
      setServing((n) => (n >= 45 ? 38 : n + 1))
    }, 8000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {/* Top illustration - taller, art centered in frame */}
      <div className="relative h-[min(52vw,280px)] shrink-0 overflow-hidden sm:h-[300px]">
        <WelcomeHeroArt />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/85 to-transparent"
        />
      </div>

      <div className="relative flex flex-1 flex-col px-6 pb-8 pt-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.natural}
          className="text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#111111] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--order-accent)]">
              A
            </span>
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-[1.75rem] font-bold leading-tight tracking-tight text-[#111111]">
            {SHOP.name}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#8a8a8a]">{SHOP.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#f3f3f3] px-3 py-1.5 text-xs font-medium text-[#555555]">
              {SHOP.hours}
            </span>
            <span className="inline-flex items-center rounded-full bg-[#f3f3f3] px-3 py-1.5 text-xs font-medium text-[#555555]">
              {SHOP.address}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.natural, delay: 0.06 }}
          className="mt-7 flex items-center gap-3 rounded-2xl border border-[#e8e8e8] bg-white px-3.5 py-3"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#f0f0f0] ring-1 ring-black/[0.04]">
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#d8f5e6] to-[#b8e8d0]">
              <span className="font-[family-name:var(--font-display)] text-sm font-bold tabular-nums text-[#1a7a4c]">
                #{serving}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-[#111111]">Now serving</p>
            <p className="mt-0.5 text-xs text-[#8a8a8a]">Open today</p>
          </div>
        </motion.div>

        <div className="mt-auto flex flex-col gap-3 pt-10">
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.natural, delay: 0.14 }}
            whileTap={{ scale: 0.985 }}
            onClick={onBook}
            className="h-14 w-full rounded-full bg-[#111111] text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            Book now
          </motion.button>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...spring.gentle, delay: 0.18 }}
            onClick={onRetrieve}
            className="py-2 text-center text-sm font-semibold text-[#666666] transition hover:text-[#111111]"
          >
            I have a booking
          </motion.button>
          <p className="pt-1 text-center text-[11px] tracking-wide text-[#b0b0b0]">
            Powered by Meikigo
          </p>
        </div>
      </div>
    </div>
  )
}

/** Soft mountain / mist scene - layout reference aesthetic */
function WelcomeHeroArt() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#e8f2f6]">
      <svg
        className="h-[120%] w-[120%] max-w-none"
        viewBox="0 0 390 240"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dceaf1" />
            <stop offset="55%" stopColor="#eef5f8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="farPeak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c5d8e4" />
            <stop offset="100%" stopColor="#e3eef4" />
          </linearGradient>
          <linearGradient id="nearPeak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a8c4d6" />
            <stop offset="100%" stopColor="#d4e5ee" />
          </linearGradient>
          <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        <rect width="390" height="240" fill="url(#sky)" />

        <path
          d="M-20 160 C40 110, 90 95, 140 120 C180 140, 210 100, 260 115 C310 130, 350 95, 410 130 L410 240 L-20 240 Z"
          fill="url(#farPeak)"
        />
        <path
          d="M-30 185 C50 145, 110 155, 160 165 C220 180, 250 140, 310 155 C360 168, 400 145, 430 170 L430 240 L-30 240 Z"
          fill="url(#nearPeak)"
        />

        <ellipse cx="72" cy="178" rx="28" ry="36" fill="#3d9a5c" opacity="0.9" />
        <ellipse cx="98" cy="188" rx="22" ry="28" fill="#2f7d4a" />
        <ellipse cx="48" cy="192" rx="18" ry="24" fill="#4aad68" />

        <ellipse cx="300" cy="172" rx="32" ry="40" fill="#3d9a5c" opacity="0.85" />
        <ellipse cx="328" cy="186" rx="24" ry="30" fill="#2f7d4a" />
        <ellipse cx="275" cy="190" rx="20" ry="26" fill="#56b872" />

        <ellipse cx="195" cy="198" rx="16" ry="20" fill="#3d9a5c" opacity="0.7" />

        <rect y="170" width="390" height="70" fill="url(#mist)" />
      </svg>
    </div>
  )
}
