import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { spring } from '@/motion/springs'

const BOOKINGS = [
  {
    id: 42,
    name: 'Ahmad R.',
    time: '2:30 PM',
    status: 'Booked',
    color: '#5B8DEF',
    services: 'Haircut + Beard',
    total: 'RM 55',
    phone: '+60 12-345 1111',
  },
  {
    id: 43,
    name: 'Walk-in Lee',
    time: '3:00 PM',
    status: 'Arrived',
    color: '#F5A623',
    services: 'Haircut',
    total: 'RM 35',
    phone: '—',
  },
  {
    id: 44,
    name: 'Hassan K.',
    time: '3:30 PM',
    status: 'Booked',
    color: '#5B8DEF',
    services: 'Kids cut',
    total: 'RM 25',
    phone: '+60 12-999 8888',
  },
]

export function CardToDetail() {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-black/40">
        Today board · tap to expand
      </p>
      <motion.div layout className="flex flex-col gap-2">
        {BOOKINGS.map((b) => {
          const isOpen = expandedId === b.id
          return (
            <motion.div
              key={b.id}
              layout
              className="overflow-hidden rounded-xl border bg-white shadow-sm"
              style={{
                borderColor: isOpen ? '#38CE8766' : 'rgba(0,0,0,0.06)',
              }}
              transition={spring.natural}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : b.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span
                  className="h-10 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1C1C1C]">
                    #{b.id} {b.name}
                  </p>
                  <p className="text-xs text-black/45">{b.time} · Ali</p>
                </div>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={spring.snappy}
                  className="text-black/30"
                >
                  ▾
                </motion.span>
                <span className="text-xs font-medium" style={{ color: b.color }}>
                  {b.status}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={spring.natural}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-black/[0.06] px-4 pb-4 pt-3">
                      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-black/35">
                            Services
                          </p>
                          <p className="font-medium text-[#1C1C1C]">{b.services}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-black/35">
                            Total
                          </p>
                          <p className="font-medium text-[#1C1C1C]">{b.total}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[11px] uppercase tracking-wide text-black/35">
                            Phone
                          </p>
                          <p className="font-medium text-[#1A7A4C]">{b.phone}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          className="rounded-xl bg-[#F5A623] py-3 text-sm font-semibold text-white"
                        >
                          Mark arrived
                        </button>
                        <button
                          type="button"
                          className="rounded-xl bg-black/[0.04] py-2.5 text-sm font-medium text-[#1C1C1C]/60"
                        >
                          Reassign barber
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
