import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  PlusIcon,
  XMarkIcon,
  UserPlusIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/solid'
import { spring, stagger } from '@/motion/springs'

const ACTIONS = [
  { label: 'Walk-in', icon: UserPlusIcon },
  { label: 'Calendar', icon: CalendarIcon },
  { label: 'My day', icon: ChartBarIcon },
]

export function GlassFab() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative mx-auto flex h-[420px] w-full max-w-lg items-end justify-end rounded-2xl border border-black/[0.06] bg-gradient-to-b from-[#F9F9F8] to-[#F0FAF5] p-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 rounded-2xl bg-black/20 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={spring.gentle}
            className="absolute bottom-24 right-6 overflow-hidden rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-xl"
          >
            <motion.div
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: stagger.delay } },
              }}
              className="flex flex-col gap-2"
            >
              {ACTIONS.map(({ label, icon: Icon }) => (
                <motion.button
                  key={label}
                  type="button"
                  variants={{
                    hidden: { opacity: 0, x: 12 },
                    show: { opacity: 1, x: 0 },
                  }}
                  transition={spring.natural}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-[#1C1C1C] hover:bg-black/[0.04]"
                >
                  <Icon className="h-5 w-5 text-[#1A7A4C]" />
                  {label}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
        className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#1C1C1C] text-white shadow-lg"
        whileTap={{ scale: 0.92 }}
        transition={spring.snappy}
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={spring.natural}
          className="flex items-center justify-center"
        >
          {open ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <PlusIcon className="h-6 w-6" />
          )}
        </motion.span>
      </motion.button>
    </div>
  )
}
