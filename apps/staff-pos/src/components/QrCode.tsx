'use client'

import { useEffect, useState } from 'react'

type QrCodeProps = {
  value: string
  size?: number
  className?: string
  label?: string
}

export function QrCode({ value, size = 160, className = '', label }: QrCodeProps) {
  const [markup, setMarkup] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    import('qrcode')
      .then((QRCode) =>
        QRCode.toString(value, {
          type: 'svg',
          margin: 1,
          width: size,
          color: { dark: '#181925', light: '#ffffff' },
        }),
      )
      .then((svg) => {
        if (!cancelled) setMarkup(svg)
      })
      .catch(() => {
        if (!cancelled) setMarkup(null)
      })

    return () => {
      cancelled = true
    }
  }, [value, size])

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className="overflow-hidden rounded-xl border border-fog bg-paper-white p-2"
        style={{ width: size + 16, height: size + 16 }}
        role="img"
        aria-label={label ?? `QR code for ${value}`}
      >
        {markup ? (
          <div
            className="[&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: markup }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ash">…</div>
        )}
      </div>
    </div>
  )
}
