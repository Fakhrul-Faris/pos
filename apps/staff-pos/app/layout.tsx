import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-openrunde',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Miki Staff POS',
  description: 'Staff counter POS prototype',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--pos-canvas-soft)] text-[var(--pos-ink)] antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
