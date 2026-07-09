import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500'],
  style: ['normal', 'italic'],
})

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
      <body className={dmSans.className}>{children}</body>
    </html>
  )
}
