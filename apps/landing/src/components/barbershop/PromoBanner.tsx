'use client'

import { useState } from 'react'
import { promoBanner } from './data'

export function PromoBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      id="navbar-banner"
      className="sticky top-0 z-[60] flex items-center justify-center gap-3 bg-promo-bg px-4 py-3 text-center text-body-sm text-paper"
    >
      <p className="m-0 leading-snug">{promoBanner}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 border-0 bg-transparent cursor-pointer text-ash-text hover:text-paper px-2"
        aria-label="Dismiss promo banner"
      >
        ×
      </button>
    </div>
  )
}
