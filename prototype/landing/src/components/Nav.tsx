import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { NavBusinessesPanel, NavDropdownPanel, NavDropdownTrigger } from './NavDropdown'
import { Btn } from './Btn'
import { businessCategoriesMenu, productMenu } from './nav-menu-data'

const spring = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 36,
  mass: 0.8,
}

type NavVariant = 'default' | 'overlay'
type MenuId = 'product' | 'businesses' | null

export function Nav({ variant: _variant = 'default' }: { variant?: NavVariant }) {
  const [hidden, setHidden] = useState(false)
  const [activeMenu, setActiveMenu] = useState<MenuId>(null)
  const closeTimer = useRef<number | null>(null)
  const lastScrollY = useRef(0)

  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (current) => {
    const delta = current - lastScrollY.current
    if (current < 64) {
      setHidden(false)
    } else if (delta > 8) {
      setHidden(true)
      setActiveMenu(null)
    } else if (delta < -8) {
      setHidden(false)
    }
    lastScrollY.current = current
  })

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    }
  }, [])

  function openMenu(id: MenuId) {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setActiveMenu(id)
  }

  function scheduleClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setActiveMenu(null), 120)
  }

  function keepOpen(id: MenuId) {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setActiveMenu(id)
  }

  return (
    <motion.header
      className="nav-floating hidden md:block fixed left-1/2 z-50 min-w-[586px] -translate-x-1/2 group-has-[#navbar-banner]/page-layout-container:top-[calc(26px+var(--navbar-banner-height))] top-[26px]"
      initial={false}
      animate={{
        y: hidden ? -88 : 0,
        opacity: hidden ? 0 : 1,
      }}
      transition={spring}
      style={{ pointerEvents: hidden ? 'none' : 'auto' }}
      onMouseLeave={scheduleClose}
    >
      <div className="relative">
        <nav
          className="nav-glass flex items-center gap-1 pl-5 pr-2 py-1.5"
          aria-label="Main"
        >
          <a href="#" className="flex items-center no-underline shrink-0 mr-3 text-ink">
            <img
              src="/brand/miki-logo.png"
              alt="Miki"
              className="h-6 w-auto"
            />
          </a>

          <div className="flex flex-1 items-center justify-center gap-0.5">
            <div
              className="relative"
              onMouseEnter={() => openMenu('product')}
              onMouseLeave={scheduleClose}
            >
              <NavDropdownTrigger
                label="Product"
                open={activeMenu === 'product'}
                onEnter={() => openMenu('product')}
                onLeave={scheduleClose}
              />
            </div>

            <div
              className="relative"
              onMouseEnter={() => openMenu('businesses')}
              onMouseLeave={scheduleClose}
            >
              <NavDropdownTrigger
                label="Businesses"
                open={activeMenu === 'businesses'}
                onEnter={() => openMenu('businesses')}
                onLeave={scheduleClose}
              />
            </div>

            <a href="#compare" className="nav-link">
              Compare
            </a>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <a href="#signin" className="nav-link">
              Sign in
            </a>
            <Btn href="#cta" variant="nav">
              Start free
            </Btn>
          </div>
        </nav>

        <div onMouseEnter={() => keepOpen(activeMenu)} onMouseLeave={scheduleClose}>
          <NavDropdownPanel
            active={activeMenu === 'product'}
            columns={productMenu}
            onClose={() => setActiveMenu(null)}
          />
          <NavBusinessesPanel
            active={activeMenu === 'businesses'}
            categories={businessCategoriesMenu}
            onClose={() => setActiveMenu(null)}
          />
        </div>
      </div>
    </motion.header>
  )
}
