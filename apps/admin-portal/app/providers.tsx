'use client'

import type { ReactNode } from 'react'
import { AdminStoreProvider } from '@/data/store'

export function Providers({ children }: { children: ReactNode }) {
  return <AdminStoreProvider>{children}</AdminStoreProvider>
}
