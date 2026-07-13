import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Miki · Queue, Booking & Checkout for Malaysian Shops',
  description:
    'One system for walk-ins, bookings, and checkout. Your QR. Your tablet. 14 days free, no card.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
