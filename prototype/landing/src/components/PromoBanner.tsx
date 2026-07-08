import { useEffect, useState } from 'react'

const STORAGE_KEY = 'miki-promo-dismissed'

export function PromoBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(localStorage.getItem(STORAGE_KEY) !== '1')
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      id="navbar-banner"
      className="bg-promo-bg text-paper text-body-sm tracking-[0.03em]"
    >
      <div className="container-page flex items-center justify-between gap-4 py-3">
        <p className="m-0 text-center flex-1">
          First 50 <span className="text-signal font-medium">barbershops</span>{' '}
          per city get{' '}
          <span className="text-signal font-medium">RM89/mo locked for life</span>
          . Start your 14-day trial: full features, no card required.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 bg-transparent border-0 text-ash cursor-pointer p-2 hover:text-paper transition-colors"
          aria-label="Dismiss promo banner"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
