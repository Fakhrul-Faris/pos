'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookingFlow } from './BookingFlow'
import { WelcomePage } from './WelcomePage'
import { RetrieveBookingPage } from './RetrieveBookingPage'
import { spring } from '@/motion/springs'

type Screen = 'welcome' | 'book' | 'retrieve'

export function OrderApp() {
  const [screen, setScreen] = useState<Screen>('welcome')

  return (
    <div className="mx-auto flex h-dvh min-h-dvh w-full max-w-md flex-col overflow-hidden bg-white sm:rounded-[2rem] sm:shadow-[0_16px_48px_rgba(0,0,0,0.1)]">
      <AnimatePresence mode="wait" initial={false}>
        {screen === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={spring.snappy}
            className="flex min-h-0 flex-1 flex-col"
          >
            <WelcomePage
              onBook={() => setScreen('book')}
              onRetrieve={() => setScreen('retrieve')}
            />
          </motion.div>
        )}

        {screen === 'retrieve' && (
          <motion.div
            key="retrieve"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={spring.snappy}
            className="flex min-h-0 flex-1 flex-col"
          >
            <RetrieveBookingPage
              onBack={() => setScreen('welcome')}
              onDone={() => setScreen('welcome')}
              onBookAgain={() => setScreen('book')}
            />
          </motion.div>
        )}

        {screen === 'book' && (
          <motion.div
            key="book"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={spring.snappy}
            className="flex min-h-0 flex-1 flex-col"
          >
            <BookingFlow onExit={() => setScreen('welcome')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
