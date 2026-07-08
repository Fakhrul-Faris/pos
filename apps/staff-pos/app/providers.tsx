'use client'

import { StoreProvider } from '@/data/store'

export function Providers({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>
}
