import { Btn } from '../Btn'
import { Reveal, RevealGroup, RevealHeadline, RevealItem } from '../Reveal'
import { ExpandableScreenTrigger } from '../ui/expandable-screen'
import { closingCta } from './data'

const footerLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Compare', href: '/compare' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
]

const socialLinks = [
  {
    label: 'X',
    href: 'https://x.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.527-8.603L1.25 2.25h6.793l4.263 5.684L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
        <path d="M4.98 3.5C4.98 4.881 3.87 6 2.5 6S.02 4.881.02 3.5C.02 2.12 1.13 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.5h4.56V23H.22V8.5zM8.34 8.5h4.37v1.98h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 7v7.88h-4.56v-6.98c0-1.66-.03-3.8-2.32-3.8-2.32 0-2.68 1.81-2.68 3.68V23H8.34V8.5z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
        <path d="M23.5 6.2a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 00.5 6.2 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.8 3.02 3.02 0 002.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 002.12-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
      </svg>
    ),
  },
]

export function BarbershopClosingCta() {
  return (
    <section className="py-20 md:py-28 bg-ink text-paper" data-nav-bg="dark">
      <div className="container-page max-w-2xl text-center">
        <RevealGroup stagger={0.12} delay={0.1}>
          <RevealItem>
            <RevealHeadline
              segments={[
                { text: 'Stop juggling three' },
                { text: 'different apps.', className: 'italic-beat' },
              ]}
              className="text-heading text-pure-white m-0 mb-5"
            />
          </RevealItem>
          <RevealItem>
            <p className="text-body-lg text-ivory/80 m-0 mb-3 tracking-[-0.01em]">
              {closingCta.beats.join(' ')}
            </p>
          </RevealItem>
          <RevealItem>
            <p className="text-body-lg text-ivory m-0 mb-8">{closingCta.body}</p>
          </RevealItem>
          <RevealItem>
            <ExpandableScreenTrigger>
              <Btn variant="hero">{closingCta.cta}</Btn>
            </ExpandableScreenTrigger>
            <p className="text-caption text-ash-text m-0 mt-4 tracking-[0.01em]">
              {closingCta.sub}
            </p>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  )
}

export function BarbershopFooter() {
  return (
    <footer className="barbershop-footer">
      <div className="barbershop-footer__inner">
        <Reveal delay={0.08} y={12}>
          <a href="/" className="barbershop-footer__brand" aria-label="Miki home">
            <img src="/brand/miki-logo.png" alt="Miki" className="barbershop-footer__logo" />
          </a>

          <nav aria-label="Barbershop footer">
            <ul className="barbershop-footer__links">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="barbershop-footer__rule" aria-hidden />

          <div className="barbershop-footer__meta">
            <p className="barbershop-footer__copy">© 2026 Miki · Malaysia</p>
            <nav aria-label="Social media" className="barbershop-footer__social">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </nav>
          </div>
        </Reveal>
      </div>
    </footer>
  )
}
