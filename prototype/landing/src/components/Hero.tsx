import { useState } from 'react'
import { motion } from 'motion/react'
import { HeroBusinessPicker } from './HeroBusinessPicker'
import { Btn } from './Btn'
import { Nav } from './Nav'
import { MobileNav } from './MobileNav'

export function Hero() {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <>
      <Nav variant="overlay" />
      <MobileNav />
      <HeroBusinessPicker open={pickerOpen} onOpenChange={setPickerOpen} />
      <section
        className="hero-mercury relative group-has-[#navbar-banner]/page-layout-container:min-h-[calc(100dvh-var(--navbar-banner-height))] min-h-dvh flex flex-col"
        data-id="theme-switcher"
        data-theme="darkNeutral"
        data-apply-globally="false"
      >
        <div className="hero-mercury-bg" aria-hidden />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex max-w-[640px] flex-col items-center"
          >
            <h1 className="hero-display text-pure-white m-0 mb-6">
              Running a shop is{' '}
              <span className="italic-beat">hard enough.</span>
            </h1>
            <p className="text-body-lg text-ivory m-0 mb-10 max-w-[520px] leading-[1.35] font-normal">
              You shouldn&apos;t need three apps, two phones, and a tired owner
              just to get through Saturday. Miki puts the counter back on one
              screen.
            </p>

            <div id="verticals" className="flex flex-col items-center gap-4">
              <Btn variant="hero" onClick={() => setPickerOpen(true)}>
                Pick your business
              </Btn>
              <p className="text-caption text-ash-text m-0 tracking-[0.01em]">
                14 days free · No card · No hardware bundle
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
