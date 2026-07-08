import { useId, useState } from 'react'
import { motion } from 'motion/react'
import { RevealGroup, RevealHeadline, RevealItem } from './Reveal'

const spring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 24,
  mass: 0.85,
}

const items = [
  {
    q: 'Do I need to buy specific hardware?',
    a: 'No. Miki runs on your own phone or tablet. Open the counter in your browser — log in and go.',
  },
  {
    q: 'How long does it take to set up?',
    a: 'Minutes. Create an account, add your services, and you are ready to take walk-ins and bookings.',
  },
  {
    q: 'Is there a contract or hardware bundle?',
    a: 'Never. Miki is free for 14 days, requires no credit card, and works with the gear you already own.',
  },
]

function FaqItem({
  item,
  isOpen,
  onToggle,
  id,
}: {
  item: (typeof items)[number]
  isOpen: boolean
  onToggle: () => void
  id: string
}) {
  return (
    <motion.li
      layout
      className="faq-accordion-item bg-paper hover:bg-linen/60 relative cursor-pointer overflow-hidden px-4 list-none"
      style={{ marginBlock: 0, borderRadius: 0 }}
    >
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="faq-accordion-trigger w-full flex items-center justify-between gap-3 bg-transparent border-0 cursor-pointer text-left outline-none focus:outline-none"
      >
        <span className="text-body font-medium text-ink">{item.q}</span>
        <motion.span
          aria-hidden
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={spring}
          className="text-signal text-xl shrink-0 leading-none"
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
        <p className="text-body text-muted m-0 pb-4 pr-8">{item.a}</p>
      </motion.div>
    </motion.li>
  )
}

export function FAQ() {
  const baseId = useId()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="py-[var(--section-gap)] bg-linen/50">
      <div className="container-page max-w-lg">
        <RevealHeadline
          segments={[{ text: 'FAQ' }]}
          className="text-heading text-ink m-0 mb-10"
        />

        <RevealGroup className="faq-accordion m-0 p-0 list-none w-full overflow-clip rounded-3xl border border-black/8 bg-paper shadow-[var(--shadow-card)]" stagger={0.1} delay={0.1}>
            {items.map((item, i) => (
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
