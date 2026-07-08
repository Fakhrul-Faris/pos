import { motion } from 'motion/react'
import { SectionLabel, ItalicHeadline } from './ui'
import { DeviceMockup } from './DeviceMockup'

const steps = [
  {
    num: '01',
    title: 'Customer',
    copy: 'Book or queue from your QR.',
    device: 'phone' as const,
  },
  {
    num: '02',
    title: 'Counter',
    copy: 'Run the day from a shared tablet.',
    device: 'tablet' as const,
  },
  {
    num: '03',
    title: 'Owner',
    copy: 'Manage from any browser.',
    device: 'laptop' as const,
  },
]

export function ThreeSurfaces() {
  return (
    <section id="how-it-works" className="py-[var(--section-gap)] bg-linen/50">
      <div className="container-page">
        <SectionLabel>Three surfaces</SectionLabel>
        <ItalicHeadline before="Three screens." italic="One shop." />

        <div className="mt-16 flex flex-col gap-20">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              className={`grid md:grid-cols-2 gap-12 items-center ${
                i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''
              }`}
            >
              <div className="flex gap-8">
                <span className="text-heading text-signal/40 font-medium shrink-0">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-heading-sm text-ink m-0 mb-3">{step.title}</h3>
                  <p className="text-subheading text-muted m-0">{step.copy}</p>
                </div>
              </div>
              <div className="flex justify-center">
                <DeviceMockup type={step.device} label="" className="scale-110" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
