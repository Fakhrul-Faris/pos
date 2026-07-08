import { useId, useState } from 'react'
import { motion } from 'motion/react'

const spring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 24,
  mass: 0.85,
}

const items = [
  {
    q: 'Need hardware from Miki?',
    a: 'No. Your tablet. We sell software.',
  },
  {
    q: 'Credit card to start?',
    a: 'No. 14-day trial on the full plan.',
  },
  {
    q: 'Only for one type of shop?',
    a: 'Barbershops are live. More verticals shipping. Same platform.',
  },
  {
    q: 'Can I use my own DuitNow QR?',
    a: 'Yes. Always. We never block checkout.',
  },
  {
    q: 'Do you take a cut of every sale?',
    a: 'Only on optional integrated payments. Cash and your DuitNow: RM0.',
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
      className="faq-accordion-item bg-paper hover:bg-linen/60 relative cursor-pointer overflow-hidden px-4"
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
        <h2 className="text-heading text-ink m-0 mb-10">FAQ</h2>

        <motion.ul
          layout
          className="faq-accordion m-0 p-0 list-none w-full overflow-clip rounded-3xl border border-black/8 bg-paper shadow-[var(--shadow-card)]"
        >
          {items.map((item, i) => (
            <FaqItem
              key={item.q}
              id={`${baseId}-${i}`}
              item={item}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
