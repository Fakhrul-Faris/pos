'use client'

import { useState } from 'react'
import { ManagerPinSheet } from '@/components/BarberSwitcher'
import { MotionOverlay } from '@/components/motion/MotionOverlay'
import { PrototypeControls } from '@/components/PrototypeControls'
import { MANAGER_ACTING_ID, actingLabel } from '@/data/mock'
import { useStore } from '@/data/store'

type MoreSheetProps = {
  open: boolean
  onClose: () => void
  onSearch: () => void
  onMyDay: () => void
  onEndSession: () => void
  onToggleOffline?: (goingOffline: boolean, pendingCount: number) => void
  onToast?: (t: { kind: 'success' | 'info' | 'error'; title: string; message?: string }) => void
}

export function MoreSheet({
  open,
  onClose,
  onSearch,
  onMyDay,
  onEndSession,
  onToggleOffline,
  onToast,
}: MoreSheetProps) {
  const {
    isOffline,
    pendingSyncCount,
    setOffline,
    actingStaffId,
    setActingStaffId,
    staff,
    isOnShift,
    endShift,
    setStaffOverride,
    lanes,
  } = useStore()
  const [endShiftConfirm, setEndShiftConfirm] = useState(false)
  const [managerPinOpen, setManagerPinOpen] = useState(false)

  const isManager = actingStaffId === MANAGER_ACTING_ID
  const actingIsBarber = !isManager
  const onShift = actingIsBarber && isOnShift(actingStaffId)
  const actingName = actingLabel(actingStaffId, staff)
  const onBreak = lanes.find((l) => l.staff.id === actingStaffId)?.staffStatus === 'break'

  const rowClass =
    'flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left text-sm font-medium text-carbon transition-colors hover:bg-mist'

  return (
    <>
      <MotionOverlay
        open={open}
        onClose={onClose}
        variant="sheet-bottom"
        zClass="z-[55]"
        shellClassName="flex items-end justify-center sm:items-center sm:p-4"
        backdropClassName="bg-carbon/30"
        panelClassName="w-full max-w-md rounded-t-xl border border-fog bg-paper-white p-5 shadow-panel sm:rounded-lg"
        aria-labelledby="more-sheet-title"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="more-sheet-title" className="font-display text-lg font-medium tracking-ui text-carbon">
            More
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-12 min-w-[4.5rem] items-center justify-center rounded-md bg-mist px-4 text-sm font-semibold text-carbon transition-colors hover:bg-fog"
            aria-label="Close"
          >
            Done
          </button>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            className={rowClass}
            onClick={() => {
              onClose()
              onSearch()
            }}
          >
            <span>Search</span>
            <span className="text-xs font-normal text-ash">Name, #, phone</span>
          </button>
          <button
            type="button"
            className={rowClass}
            onClick={() => {
              onClose()
              onMyDay()
            }}
          >
            <span>My day</span>
            <span className="text-xs font-normal text-ash">Cuts & revenue</span>
          </button>
        </div>

        {actingIsBarber && (
          <>
            <div className="my-4 border-t border-fog" />
            <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-ui text-ash">
              Shift · {actingName}
            </p>
            <div className="space-y-1">
              {onShift ? (
                <>
                  <button
                    type="button"
                    className={rowClass}
                    onClick={() => {
                      if (onBreak) {
                        setStaffOverride(actingStaffId, null)
                        onToast?.({ kind: 'info', title: 'Back from break', message: actingName })
                      } else {
                        setStaffOverride(actingStaffId, 'break')
                        onToast?.({ kind: 'info', title: 'On break', message: actingName })
                      }
                      onClose()
                    }}
                  >
                    <span>{onBreak ? 'Back from break' : 'On break'}</span>
                    <span className="text-xs font-normal text-ash">
                      {onBreak ? 'Available again' : 'Pause floor'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={rowClass}
                    onClick={() => setEndShiftConfirm(true)}
                  >
                    <span>End shift</span>
                    <span className="text-xs font-normal text-ash">Clock out</span>
                  </button>
                </>
              ) : (
                <p className="px-4 py-2 text-sm text-ash">
                  Not on shift — tap {actingName} on the switcher to clock in.
                </p>
              )}
            </div>
          </>
        )}

        <div className="my-4 border-t border-fog" />
        <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-ui text-ash">Manager</p>
        <div className="space-y-1">
          {!isManager ? (
            <button type="button" className={rowClass} onClick={() => setManagerPinOpen(true)}>
              <span>Act as Manager</span>
              <span className="text-xs font-normal text-ash">PIN required</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className={`${rowClass} text-ember hover:bg-[#fff0eb]`}
                onClick={() => {
                  onClose()
                  onEndSession()
                }}
              >
                End session
              </button>

              <div className="flex min-h-12 items-center justify-between rounded-xl px-4 text-sm text-graphite">
                <span>{isOffline ? 'Offline' : 'Online'}</span>
                <span className="text-xs text-ash">
                  {isOffline
                    ? `${pendingSyncCount} pending`
                    : pendingSyncCount > 0
                      ? `${pendingSyncCount} synced when online`
                      : 'Connected'}
                </span>
              </div>

              <button
                type="button"
                className={rowClass}
                onClick={() => {
                  const goingOffline = !isOffline
                  onToggleOffline?.(goingOffline, pendingSyncCount)
                  setOffline(goingOffline)
                }}
              >
                <span>Toggle offline (demo)</span>
                <span className="text-xs font-normal text-ash">
                  {isOffline ? 'Go online' : 'Go offline'}
                </span>
              </button>

              <div className="mt-4 border-t border-fog pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-ui text-ash">Staff tools</p>
                <PrototypeControls />
              </div>
            </>
          )}
        </div>
      </MotionOverlay>

      <ManagerPinSheet
        open={managerPinOpen}
        onCancel={() => setManagerPinOpen(false)}
        onSuccess={() => {
          setManagerPinOpen(false)
          setActingStaffId(MANAGER_ACTING_ID)
          onClose()
          onToast?.({ kind: 'info', title: 'Now acting as Manager' })
        }}
      />

      <MotionOverlay
        open={endShiftConfirm}
        onClose={() => setEndShiftConfirm(false)}
        variant="modal"
        zClass="z-[60]"
        backdropClassName="bg-carbon/35"
        panelClassName="w-full max-w-sm rounded-lg border border-fog bg-paper-white p-6 shadow-panel"
        aria-label="End shift"
      >
        <h2 className="font-display text-lg font-medium tracking-ui text-carbon">
          End shift for {actingName}?
        </h2>
        <p className="mt-2 text-sm text-graphite">
          Clock-out is recorded in the merchant portal attendance. You can start a new shift later
          from the barber switcher.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            className="btn-primary min-h-12 w-full px-4 py-3"
            onClick={() => {
              const result = endShift(actingStaffId, 'MANUAL_END')
              setEndShiftConfirm(false)
              onClose()
              if (result.handedOffTo) {
                onToast?.({
                  kind: 'success',
                  title: `Shift ended · ${actingName}`,
                  message: `Now acting as ${result.handedOffTo.name}`,
                })
              } else {
                onToast?.({
                  kind: 'info',
                  title: `Shift ended · ${actingName}`,
                  message: 'Clock in again from the switcher to work the floor.',
                })
              }
            }}
          >
            End shift
          </button>
          <button
            type="button"
            className="btn-ghost min-h-12 w-full px-4 py-3"
            onClick={() => setEndShiftConfirm(false)}
          >
            Keep working
          </button>
        </div>
      </MotionOverlay>
    </>
  )
}
