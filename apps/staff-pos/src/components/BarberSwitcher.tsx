'use client'

import { MANAGER_ACTING_ID, actingLabel, type StaffStatus } from '../data/mock'
import { useStore } from '../data/store'

function statusHint(status: StaffStatus): string | undefined {
  if (status === 'break') return 'On break'
  if (status === 'off') return 'Off shift'
  return undefined
}

export function BarberSwitcher({
  onActingChange,
}: {
  onActingChange?: (name: string) => void
}) {
  const { staff, lanes, actingStaffId, setActingStaffId } = useStore()

  const switchTo = (id: string) => {
    if (id === actingStaffId) return
    setActingStaffId(id)
    onActingChange?.(actingLabel(id, staff))
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[10px] font-medium uppercase tracking-ui text-ash">Acting as</p>
      <div
        className="flex items-end gap-1.5 rounded-full border border-fog bg-mist p-1.5"
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
              className={`relative flex flex-col items-center gap-1 rounded-full transition-all duration-200 ${
                active ? 'scale-105' : away ? 'opacity-50 hover:opacity-70' : 'opacity-70 hover:opacity-100'
              }`}
              aria-pressed={active}
              aria-current={active ? 'true' : undefined}
              aria-label={
                away ? `${s.name}, ${statusHint(status)}` : active ? `${s.name}, active` : `Act as ${s.name}`
              }
            >
              <span
                className={`flex items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 ${
                  active ? 'h-11 w-11 ring-2 ring-carbon/20 shadow-panel' : 'h-10 w-10'
                } ${s.headerClass}`}
              >
                {s.name.charAt(0)}
              </span>
              {away && (
                <span
                  className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-mist ${
                    status === 'break' ? 'bg-amber' : 'bg-ash/60'
                  }`}
                  aria-hidden
                />
              )}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => switchTo(MANAGER_ACTING_ID)}
          title="Manager"
          className={`relative flex flex-col items-center gap-1 rounded-full transition-all duration-200 ${
            actingStaffId === MANAGER_ACTING_ID
              ? 'scale-105'
              : 'opacity-70 hover:opacity-100'
          }`}
          aria-pressed={actingStaffId === MANAGER_ACTING_ID}
          aria-current={actingStaffId === MANAGER_ACTING_ID ? 'true' : undefined}
          aria-label={
            actingStaffId === MANAGER_ACTING_ID ? 'Manager, active' : 'Act as Manager'
          }
        >
          <span
            className={`flex items-center justify-center rounded-full bg-carbon text-[10px] font-bold uppercase tracking-ui text-paper-white transition-all duration-200 ${
              actingStaffId === MANAGER_ACTING_ID
                ? 'h-11 w-11 ring-2 ring-carbon/20 shadow-panel'
                : 'h-10 w-10'
            }`}
          >
            Mgr
          </span>
        </button>
      </div>
      <p className="min-h-[1rem] text-xs font-medium text-carbon">
        {actingLabel(actingStaffId, staff)}
      </p>
    </div>
  )
}
