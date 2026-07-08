'use client'

import { useState } from 'react'
import { useStore } from '../data/store'

function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

export function PrototypeControls() {
  const { demoNowMinutes, setDemoNowMinutes } = useStore()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 min-w-12 items-center justify-center rounded-full border border-fog bg-paper-white text-xs font-medium text-ash transition-colors hover:bg-mist"
        title="Prototype controls"
        aria-expanded={open}
      >
        Demo
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close demo controls"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-fog bg-paper-white p-4 shadow-panel">
            <p className="text-xs font-medium uppercase tracking-ui text-ash">Demo time</p>
            <p className="mt-1 font-display text-lg font-medium tracking-ui text-carbon">
              {minutesToLabel(demoNowMinutes)}
            </p>
            <input
              type="range"
              min={9 * 60}
              max={20 * 60}
              step={15}
              value={demoNowMinutes}
              onChange={(e) => setDemoNowMinutes(Number(e.target.value))}
              className="mt-3 w-full"
              aria-label="Demo time"
            />
            <p className="mt-2 text-[11px] text-ash">Shifts upcoming vs late on the floor board.</p>
          </div>
        </>
      )}
    </div>
  )
}
