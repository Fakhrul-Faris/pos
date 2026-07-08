import { useEffect, useState } from 'react'
import { Btn } from './Btn'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="md:hidden fixed left-4 right-4 z-50 top-3 group-has-[#navbar-banner]/page-layout-container:top-[calc(12px+var(--navbar-banner-height))]">
      <nav
        className="nav-glass flex items-center justify-between pl-4 pr-2 py-2"
        aria-label="Main mobile"
      >
        <a href="#" className="flex items-center gap-2 no-underline text-ink">
          <span className="w-2 h-2 rounded-full bg-signal" />
          <span className="text-body-sm font-medium">Miki</span>
        </a>
        <div className="flex items-center gap-2">
          <Btn href="#cta" variant="nav" className="text-body-sm">
            Start free
          </Btn>
          <button
            type="button"
            className="nav-link border-0 bg-transparent cursor-pointer px-3"
            aria-expanded={open}
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>
        </div>
      </nav>

      <div
        className="nav-popup mt-2 transition-all duration-300 ease-out origin-top opacity-0 scale-90 pointer-events-none data-[active=true]:opacity-100 data-[active=true]:scale-100 data-[active=true]:pointer-events-auto"
        data-active={open}
      >
        <div className="nav-popup-panel p-2 flex flex-col gap-1">
          <a href="#compare" className="nav-popup-item" onClick={() => setOpen(false)}>
            <span className="nav-popup-item-title">Product</span>
          </a>
          <a href="#verticals" className="nav-popup-item" onClick={() => setOpen(false)}>
            <span className="nav-popup-item-title">Businesses</span>
          </a>
          <a href="#compare" className="nav-popup-item" onClick={() => setOpen(false)}>
            <span className="nav-popup-item-title">Compare</span>
          </a>
          <a href="#signin" className="nav-popup-item" onClick={() => setOpen(false)}>
            <span className="nav-popup-item-title">Sign in</span>
          </a>
        </div>
      </div>
    </header>
  )
}
