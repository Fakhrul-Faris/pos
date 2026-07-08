'use client'

import { useEffect } from 'react'
import { useStore } from '../data/store'

type PartyAssignDrawerProps = {
  bookingId: string | null
  onClose: () => void
  onReadyForPayment: () => void
}

export function PartyAssignDrawer({
  bookingId,
  onClose,
  onReadyForPayment,
}: PartyAssignDrawerProps) {
  const {
    getBookingById,
    staff,
    lanes,
    assignPartyMemberStaff,
    startPartyMember,
    completePartyMember,
    markPartyMemberNoShow,
  } = useStore()
  const booking = bookingId ? getBookingById(bookingId) : null

  useEffect(() => {
    if (!bookingId) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [bookingId, onClose])

  useEffect(() => {
    if (booking?.partyPhase === 'ready-pay') onReadyForPayment()
  }, [booking?.partyPhase, onReadyForPayment])

  if (!booking?.partyMembers) return null

  const activeMembers = booking.partyMembers.filter((m) => m.status !== 'no-show' && m.status !== 'expected')

  function staffBusyLabel(staffId: string) {
    const lane = lanes.find((l) => l.staff.id === staffId)
    const serving = lane?.now[0]
    if (serving) return `Finishing #${serving.queueNumber ?? '—'}`
    return null
  }

  return (
    <div className="fixed inset-0 z-[55] flex justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-carbon/20" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-lg flex-col border-l border-fog bg-paper-white shadow-panel">
        <header className="border-b border-fog px-5 py-4">
          <p className="text-xs font-medium tracking-ui text-lavender">Assign chairs</p>
          <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
            {booking.customer}
          </h2>
          <p className="mt-1 text-sm text-ash">Run cuts in parallel across barbers</p>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {staff.map((s) => {
            const busy = staffBusyLabel(s.id)
            const membersHere = activeMembers.filter((m) => m.staffId === s.id)
            return (
              <section key={s.id} className="rounded-2xl border border-fog">
                <div className="flex items-center justify-between border-b border-fog px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${s.headerClass}`}
                    >
                      {s.name.charAt(0)}
                    </span>
                    <span className="font-medium text-carbon">{s.name}</span>
                  </div>
                  {busy && (
                    <span className="text-xs text-amber">{busy}</span>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  {membersHere.length === 0 ? (
                    <p className="py-4 text-center text-sm text-ash">—</p>
                  ) : (
                    membersHere.map((m) => (
                      <div key={m.id} className="rounded-xl border border-fog bg-linen/50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-carbon">{m.name}</p>
                            <p className="text-xs text-ash">{m.services}</p>
                          </div>
                          <span className="text-xs capitalize text-ash">{m.status.replace('-', ' ')}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {staff.length > 1 && m.status === 'waiting' && (
                            <select
                              value={m.staffId}
                              onChange={(e) =>
                                assignPartyMemberStaff(booking.id, m.id, e.target.value)
                              }
                              className="rounded-lg border border-fog px-2 py-1 text-xs"
                            >
                              {staff.map((barber) => (
                                <option key={barber.id} value={barber.id}>
                                  {barber.name}
                                </option>
                              ))}
                            </select>
                          )}
                          {m.status === 'waiting' && (
                            <button
                              type="button"
                              onClick={() => startPartyMember(booking.id, m.id)}
                              className="rounded-lg bg-lavender px-3 py-1 text-xs font-medium text-paper-white"
                            >
                              Start
                            </button>
                          )}
                          {m.status === 'in-chair' && (
                            <button
                              type="button"
                              onClick={() => completePartyMember(booking.id, m.id)}
                              className="rounded-lg bg-mint px-3 py-1 text-xs font-medium text-paper-white"
                            >
                              Complete
                            </button>
                          )}
                          {(m.status === 'waiting' || m.status === 'in-chair') && (
                            <button
                              type="button"
                              onClick={() => markPartyMemberNoShow(booking.id, m.id)}
                              className="text-xs text-ash hover:text-ember"
                            >
                              No-show
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )
          })}

          {activeMembers.filter((m) => m.status === 'waiting').length > 1 && (
            <button
              type="button"
              onClick={() => {
                for (const m of activeMembers.filter((mem) => mem.status === 'waiting')) {
                  startPartyMember(booking.id, m.id)
                }
              }}
              className="btn-ghost w-full px-4 py-2"
            >
              Start all ready
            </button>
          )}
        </div>

        <footer className="border-t border-fog px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost w-full px-4 py-2">
            Back to floor
          </button>
        </footer>
      </aside>
    </div>
  )
}
