'use client'

import { useEffect, useRef, useState } from 'react'
import { Btn } from './Btn'
import { ExpandableScreenTrigger } from './ui/expandable-screen'

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
      node.classList.contains('hero-mercury') ||
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

export function LandingNav() {
  const [bgTone, setBgTone] = useState<BgTone>('dark')
  const wrapRef = useRef<HTMLDivElement>(null)

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
    <div ref={wrapRef} className="barbershop-nav-wrap landing-nav-wrap" data-bg={bgTone}>
      <header className="barbershop-nav-desktop">
        <nav className="nav-glass flex items-center gap-6 pl-5 pr-2 py-1.5" aria-label="Main">
          <a href="/" className="flex items-center no-underline shrink-0 text-ink">
            <img src="/brand/miki-logo.png" alt="Miki" className="h-6 w-auto" />
          </a>
          <ExpandableScreenTrigger>
            <Btn variant="nav">Start free</Btn>
          </ExpandableScreenTrigger>
        </nav>
      </header>

      <header className="barbershop-nav-mobile">
        <nav
          className="nav-glass flex items-center gap-4 pl-4 pr-2 py-2"
          aria-label="Main mobile"
        >
          <a href="/" className="flex items-center no-underline shrink-0 text-ink">
            <img src="/brand/miki-logo.png" alt="Miki" className="h-6 w-auto" />
          </a>
          <ExpandableScreenTrigger>
            <Btn variant="nav" className="text-body-sm">
              Start free
            </Btn>
          </ExpandableScreenTrigger>
        </nav>
      </header>
    </div>
  )
}
