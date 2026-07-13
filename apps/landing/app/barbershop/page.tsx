import type { Metadata } from 'next'
import { BarbershopPage } from '@/components/barbershop/BarbershopPage'
import { barbershopMeta } from '@/components/barbershop/data'

export const metadata: Metadata = {
  title: barbershopMeta.title,
  description: barbershopMeta.description,
  openGraph: {
    title: barbershopMeta.title,
    description: barbershopMeta.description,
    siteName: 'Miki',
  },
}

export default function BarbershopRoute() {
  return <BarbershopPage />
}
