import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-openrunde',
})

export const metadata: Metadata = {
  title: 'Miki Admin',
  description: 'Internal ops admin portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
