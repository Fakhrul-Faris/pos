'use client'

import { useEffect, useRef, useState } from 'react'
import { Btn } from '../Btn'
import { useSignupScreen } from '../ui/expandable-screen'
import { navLinks } from './data'

type BgTone = 'light' | 'dark'

function parseRgba(color: string): { r: number; g: number; b: number; a: number } | null {
  const comma = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i,
  )
  if (comma) {
    return {
      r: Number(comma[1]),
      g: Number(comma[2]),
      b: Number(comma[3]),
      a: comma[4] === undefined ? 1 : Number(comma[4]),
    }
  }

  const space = color.match(
    /rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/i,
  )
  if (space) {
    const alphaRaw = space[4]
    const a =
      alphaRaw === undefined
        ? 1
        : alphaRaw.endsWith('%')
          ? Number(alphaRaw.slice(0, -1)) / 100
          : Number(alphaRaw)
    return {
      r: Number(space[1]),
      g: Number(space[2]),
      b: Number(space[3]),
      a,
    }
  }

  return null
}

function luminance(r: number, g: number, b: number) {
  const toLinear = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function resolveBgTone(el: Element | null): BgTone {
  let node: Element | null = el

  while (node && node !== document.documentElement) {
    const attr = node.getAttribute('data-nav-bg')
    if (attr === 'light' || attr === 'dark') return attr

    const style = getComputedStyle(node)
    const parsed = parseRgba(style.backgroundColor)

    if (parsed && parsed.a >= 0.55) {
      return luminance(parsed.r, parsed.g, parsed.b) > 0.55 ? 'light' : 'dark'
    }

    if (
      node.classList.contains('barbershop-hero') ||
      node.classList.contains('barbershop-hero__bg') ||
      node.classList.contains('barbershop-hero-layer')
    ) {
      return 'dark'
    }

    node = node.parentElement
  }

  return 'dark'
}

export function BarbershopNav() {
  const [open, setOpen] = useState(false)
  const [bgTone, setBgTone] = useState<BgTone>('dark')
  const wrapRef = useRef<HTMLDivElement>(null)
  const { openSignup } = useSignupScreen()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    let frame = 0

    function sample() {
      frame = 0
      const glass = Array.from(wrap.querySelectorAll<HTMLElement>('.nav-glass')).find((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0
      })
      if (!glass) return

      const rect = glass.getBoundingClientRect()
      const x = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2))
      const y = Math.min(window.innerHeight - 1, Math.max(0, rect.bottom + 4))

      wrap.classList.add('is-sampling')
      const hit = document.elementFromPoint(x, y)
      wrap.classList.remove('is-sampling')

      const next = resolveBgTone(hit)
      setBgTone((current) => (current === next ? current : next))
    }

    function schedule() {
      if (frame) return
      frame = window.requestAnimationFrame(sample)
    }

    sample()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <div ref={wrapRef} className="barbershop-nav-wrap" data-bg={bgTone}>
      <header className="barbershop-nav-desktop">
        <nav
          className="nav-glass flex items-center gap-1 pl-5 pr-2 py-1.5"
          aria-label="Barbershop"
        >
          <a href="/" className="flex items-center no-underline shrink-0 mr-3 text-ink">
            <img src="/brand/miki-logo.png" alt="Miki" className="h-6 w-auto" />
          </a>

          <div className="flex flex-1 items-center justify-center gap-0.5">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="nav-link">
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <a href="#signin" className="nav-link">
              Sign in
            </a>
            <Btn variant="nav" onClick={() => openSignup({ morph: false })}>
              Start for free
            </Btn>
          </div>
        </nav>
      </header>

      <header className="barbershop-nav-mobile">
        <nav
          className="nav-glass flex items-center justify-between pl-4 pr-2 py-2"
          aria-label="Barbershop mobile"
        >
          <a href="/" className="flex items-center gap-2 no-underline text-ink">
            <span className="w-2 h-2 rounded-full bg-signal" />
            <span className="text-body-sm font-medium">Miki</span>
          </a>
          <div className="flex items-center gap-2">
            <Btn
              variant="nav"
              className="text-body-sm"
              onClick={() => openSignup({ morph: false })}
            >
              Start free
            </Btn>
            <button
              type="button"
              className="nav-link border-0 bg-transparent cursor-pointer px-3"
              aria-expanded={open}
              aria-label="Open menu"
              onClick={() => setOpen((v) => !v)}
            >
              ☰
            </button>
          </div>
        </nav>

        <div
          className="nav-popup mt-2 transition-all duration-300 ease-out origin-top opacity-0 scale-90 pointer-events-none data-[active=true]:opacity-100 data-[active=true]:scale-100 data-[active=true]:pointer-events-auto"
          data-active={open}
        >
          <div className="nav-popup-panel p-2 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-popup-item"
                onClick={() => setOpen(false)}
              >
                <span className="nav-popup-item-title">{link.label}</span>
              </a>
            ))}
            <a
              href="#signin"
              className="nav-popup-item"
              onClick={() => setOpen(false)}
            >
              <span className="nav-popup-item-title">Sign in</span>
            </a>
          </div>
        </div>
      </header>
    </div>
  )
}
