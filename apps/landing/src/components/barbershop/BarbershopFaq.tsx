'use client'

import { useId, useState } from 'react'
import { motion } from 'motion/react'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'
import { faqItems } from './data'
import { SectionHeadline } from './SectionHeadline'

const spring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 24,
  mass: 0.85,
}

function FaqItem({
  item,
  isOpen,
  onToggle,
  id,
}: {
  item: (typeof faqItems)[number]
  isOpen: boolean
  onToggle: () => void
  id: string
}) {
  return (
    <motion.li layout className="barbershop-faq__item list-none">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="barbershop-faq__trigger"
      >
        <span className="barbershop-faq__question">{item.q}</span>
        <motion.span
          aria-hidden
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={spring}
          className="barbershop-faq__icon"
        >
          +
        </motion.span>
      </button>

      <motion.div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={spring}
        className="overflow-hidden"
      >
        <p className="barbershop-faq__answer">{item.a}</p>
      </motion.div>
    </motion.li>
  )
}

export function BarbershopFaq() {
  const baseId = useId()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="barbershop-faq barbershop-band barbershop-band--paper">
      <div className="container-page barbershop-contain--prose">
        <div className="barbershop-faq__header">
          <Reveal delay={0.05} y={12}>
            <span className="barbershop-faq__badge">
              <span className="barbershop-faq__badge-icon" aria-hidden>
                ?
              </span>
              FAQs
            </span>
          </Reveal>

          <SectionHeadline segments={[{ text: 'Totally fair to ask.' }]} />

          <Reveal delay={0.2} y={14}>
            <p className="barbershop-faq__subtitle">
              Answers to your question.
            </p>
          </Reveal>
        </div>

        <RevealGroup
          className="barbershop-faq__list m-0 p-0 list-none"
          stagger={0.05}
          delay={0.12}
        >
          {faqItems.map((item, i) => (
            <RevealItem key={item.q}>
              <FaqItem
                id={`${baseId}-${i}`}
                item={item}
                isOpen={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
