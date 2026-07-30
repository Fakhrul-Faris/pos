'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MotionOverlay } from '@/components/motion/MotionOverlay'
import { MANAGER_ACTING_ID, MANAGER_PIN, actingLabel, type StaffStatus } from '../data/mock'
import { useStore } from '../data/store'

function statusHint(status: StaffStatus): string | undefined {
  if (status === 'break') return 'On break'
  if (status === 'off') return 'Off shift'
  return undefined
}

function ManagerPinSheet({
  open,
  onCancel,
  onSuccess,
}: {
  open: boolean
  onCancel: () => void
  onSuccess: () => void
}) {
  const [digits, setDigits] = useState('')
  const [error, setError] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      setDigits('')
      setError(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
      if (/^\d$/.test(e.key) && digits.length < 4) {
        const next = digits + e.key
        setDigits(next)
        setError(false)
        if (next.length === 4) {
          if (next === MANAGER_PIN) onSuccess()
          else {
            setError(true)
            setDigits('')
          }
        }
      }
      if (e.key === 'Backspace') {
        setDigits((d) => d.slice(0, -1))
        setError(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [digits, onCancel, onSuccess, open])

  function press(d: string) {
    if (digits.length >= 4) return
    const next = digits + d
    setDigits(next)
    setError(false)
    if (next.length === 4) {
      window.setTimeout(() => {
        if (next === MANAGER_PIN) onSuccess()
        else {
          setError(true)
          setDigits('')
        }
      }, 80)
    }
  }

  if (!mounted) return null

  return createPortal(
    <MotionOverlay
      open={open}
      onClose={onCancel}
      variant="modal"
      zClass="z-[90]"
      backdropClassName="bg-carbon/35"
      panelClassName="w-full max-w-xs rounded-3xl border border-fog bg-paper-white p-6 shadow-panel"
      aria-labelledby="manager-pin-title"
    >
      <p className="text-center text-[10px] font-medium uppercase tracking-ui text-ash">Manager</p>
      <h2
        id="manager-pin-title"
        className="font-display mt-1 text-center text-lg font-medium tracking-ui text-carbon"
      >
        Enter PIN
      </h2>
      <p className="mt-1 text-center text-xs text-ash">Demo PIN · {MANAGER_PIN}</p>

      <div className="mt-5 flex justify-center gap-2.5" aria-live="polite">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full border ${
              digits.length > i
                ? error
                  ? 'border-ember bg-ember'
                  : 'border-carbon bg-carbon'
                : 'border-fog bg-mist'
            }`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-3 text-center text-xs font-medium text-ember">Wrong PIN — try again</p>
      )}

      <div className="mx-auto mt-6 grid w-fit grid-cols-3 gap-x-3 gap-y-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k === '' ? (
            <span key={`empty-${i}`} className="h-[3.25rem] w-[3.25rem]" />
          ) : (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === '⌫') {
                  setDigits((d) => d.slice(0, -1))
                  setError(false)
                } else press(k)
              }}
              className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-mist text-xl font-medium text-carbon transition-transform active:scale-95"
            >
              {k}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="mt-5 w-full text-center text-sm font-medium text-graphite hover:text-carbon"
      >
        Cancel
      </button>
    </MotionOverlay>,
    document.body,
  )
}

export function BarberSwitcher({
  onActingChange,
  compact = false,
}: {
  onActingChange?: (name: string) => void
  compact?: boolean
}) {
  const { staff, lanes, actingStaffId, setActingStaffId } = useStore()
  const [pinOpen, setPinOpen] = useState(false)

  const switchTo = (id: string) => {
    if (id === actingStaffId) return
    setActingStaffId(id)
    onActingChange?.(actingLabel(id, staff))
  }

  const size = compact ? 'h-9 w-9 text-[11px]' : 'h-10 w-10 text-xs'
  const activeSize = compact ? 'h-10 w-10 text-[11px]' : 'h-11 w-11 text-xs'

  return (
    <>
      <div
        className="flex items-center gap-1 rounded-full border border-fog bg-paper-white/95 p-1 shadow-panel backdrop-blur-sm"
        role="group"
        aria-label="Switch barber"
      >
        {staff.map((s) => {
          const lane = lanes.find((l) => l.staff.id === s.id)
          const status = lane?.staffStatus ?? 'available'
          const away = status === 'break' || status === 'off'
          const active = s.id === actingStaffId

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => switchTo(s.id)}
              title={away ? `${s.name} · ${statusHint(status)}` : s.name}
              className={`relative flex items-center justify-center rounded-full transition-all duration-200 ${
                active
                  ? `${activeSize} scale-105 ring-2 ring-barber shadow-sm`
                  : `${size} ${away ? 'opacity-45' : 'opacity-75 hover:opacity-100'}`
              } ${s.headerClass}`}
              aria-pressed={active}
              aria-label={
                away ? `${s.name}, ${statusHint(status)}` : active ? `${s.name}, active` : `Act as ${s.name}`
              }
            >
              {s.name.charAt(0)}
              {away && (
                <span
                  className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-mist ${
                    status === 'break' ? 'bg-amber' : 'bg-ash/60'
                  }`}
                  aria-hidden
                />
              )}
            </button>
          )
        })}

        <span className="mx-0.5 h-6 w-px shrink-0 bg-fog" aria-hidden />

        <button
          type="button"
          onClick={() => {
            if (actingStaffId === MANAGER_ACTING_ID) return
            setPinOpen(true)
          }}
          title="Manager"
          className={`flex items-center justify-center rounded-full bg-carbon font-bold uppercase tracking-ui text-paper-white transition-all duration-200 ${
            actingStaffId === MANAGER_ACTING_ID
              ? `${activeSize} scale-105 ring-2 ring-barber shadow-sm`
              : `${size} opacity-75 hover:opacity-100`
          }`}
          aria-pressed={actingStaffId === MANAGER_ACTING_ID}
          aria-label={
            actingStaffId === MANAGER_ACTING_ID ? 'Manager, active' : 'Act as Manager — PIN required'
          }
        >
          <span className="text-[9px]">Mgr</span>
        </button>
      </div>

      <ManagerPinSheet
        open={pinOpen}
        onCancel={() => setPinOpen(false)}
        onSuccess={() => {
          setPinOpen(false)
          switchTo(MANAGER_ACTING_ID)
        }}
      />
    </>
  )
}
