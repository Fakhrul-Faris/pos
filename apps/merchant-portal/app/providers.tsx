'use client'

import { BookingsProvider } from '@/data/bookingsStore'

export function Providers({ children }: { children: React.ReactNode }) {
  return <BookingsProvider>{children}</BookingsProvider>
}
