import type { Metadata } from 'next'
import { Instrument_Sans, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'

const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Miki Order App',
  description: 'Customer booking & queue: scan, book, track',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${instrument.variable} ${plex.variable} min-h-dvh bg-[var(--order-canvas)] font-[family-name:var(--font-body)] text-[var(--order-ink)] antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
