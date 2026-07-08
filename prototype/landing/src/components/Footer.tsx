const legalLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Cookies', href: '#' },
  { label: 'Sitemap', href: '#' },
  { label: 'Brand Kit', href: '#' },
]

const footerNav = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', href: '#features' },
      { label: 'Features', href: '#features' },
      { label: 'Compare', href: '#compare' },
      { label: 'Payments', href: '#payments' },
    ],
  },
  {
    title: 'Education',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Outcomes', href: '#outcomes' },
      { label: 'Verticals', href: '#verticals' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: 'mailto:hello@miki.my' },
      { label: 'Waitlist', href: '#waitlist' },
    ],
  },
]

const socialLinks = [
  {
    label: 'X',
    href: 'https://x.com/',
    icon: (
      <svg className="footer-social-icon" viewBox="0 0 28 28" aria-hidden>
        <path d="M16.6643 11.849L27.0879 0H24.6179L15.567 10.2882L8.33814 0H0L10.932 15.5581L0 27.9847H2.4707L12.0286 17.1189L19.6628 27.9847H28L16.6637 11.849H16.6643ZM13.281 15.6952L12.1734 14.1458L3.36075 1.81764H7.15484L14.2668 11.7669L15.3744 13.3162L24.619 26.2487H20.8249L13.281 15.6958V15.6952Z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/',
    icon: (
      <svg className="footer-social-icon" viewBox="0 0 36 36" aria-hidden>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M30.4036 7.89995C25.5011 7.54381 18.0753 7.54381 18 7.54381V7.56689H17.9902C17.9182 7.56689 10.4989 7.57019 5.58982 7.92303L5.37382 7.94281L5.35924 7.94424C4.72464 8.00651 4.00709 8.07691 3.31855 8.79359C2.99782 9.11675 2.61818 10.2841 2.49055 11.125C2.28415 12.9545 2.1749 14.7939 2.16327 16.6352V19.326C2.17441 21.1673 2.28366 23.0067 2.49055 24.8362C2.61491 25.6672 2.988 26.8313 3.31527 27.161C3.924 27.7975 4.77164 27.8997 5.51782 27.9887C5.70764 28.0085 5.868 28.0316 6.03491 28.058C8.83964 28.2987 17.6269 28.3877 18.0033 28.3877C18.3305 28.3877 25.5862 28.3547 30.4036 28.025L30.6262 28.0019L30.6313 28.0014C31.2682 27.9389 31.9895 27.8681 32.6782 27.1511C32.9989 26.8412 33.3818 25.6573 33.5029 24.8428C33.7094 23.0122 33.8186 21.1717 33.8302 19.3293V16.6121C33.819 14.7708 33.7098 12.9314 33.5029 11.1019C33.3753 10.2676 33.0022 9.10026 32.6749 8.7705C31.9811 8.04834 31.2742 7.97909 30.6196 7.91973L30.4036 7.89995ZM23.9994 17.9996L14.3994 23.3996V12.5996L23.9994 17.9996Z"
        />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/',
    icon: (
      <svg className="footer-social-icon" viewBox="0 0 24 24" aria-hidden>
        <path d="M16.527 19.7638H19.649V13.3579C19.649 10.155 17.6978 9.08732 15.8441 9.08732C14.1856 9.08732 13.0148 10.155 12.7222 10.8344V9.3785H9.60022V19.7638H12.9173V14.2314C12.9173 12.7756 13.8929 11.9991 14.8685 11.9991C15.8441 11.9991 16.527 12.4844 16.527 14.1344V19.7638Z" />
        <path d="M4.42949 9.3785V19.7638H7.74657V9.3785H4.42949Z" />
        <path d="M4.23438 6.07849C4.23438 7.14614 5.01486 7.92261 6.08803 7.92261C7.16119 7.92261 7.94169 7.14614 7.94169 6.07849C7.94169 5.01085 7.16119 4.23438 6.08803 4.23438C5.11242 4.23438 4.23438 5.01085 4.23438 6.07849Z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/',
    icon: (
      <svg className="footer-social-icon" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
]

function MikiMark() {
  return (
    <div className="c-footer-cta__logo" aria-hidden>
      <div className="footer-miki-mark">
        <span className="footer-miki-mark__dot" />
        <span className="footer-miki-mark__label">M</span>
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="o-footer">
      <div className="o-footer__content">
        <div className="o-footer__cta">
          <div className="c-footer-cta">
            <div className="c-footer-cta__header">
              <span className="c-footer-cta__eyebrow">Queue, booking, checkout</span>
              <h2 className="c-footer-cta__title" id="cta">
                For service shops that want a calmer counter
              </h2>
            </div>

            <MikiMark />

            <div className="c-footer-cta__actions">
              <a href="#verticals" className="c-footer-btn">
                <span>Pick your business</span>
                <span aria-hidden="true">Pick your business</span>
              </a>
              <a href="#signin" className="c-footer-btn">
                <span>Sign in</span>
                <span aria-hidden="true">Sign in</span>
              </a>
            </div>
          </div>
        </div>

        <div className="o-footer__nav">
          <div className="c-footer-nav">
            <nav className="c-footer-nav__secondary" aria-label="Footer legal">
              <ul>
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    {link.label === 'Cookies' ? (
                      <button type="button" className="c-footer-nav__text-btn">
                        {link.label}
                      </button>
                    ) : (
                      <a href={link.href}>{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <nav className="c-footer-nav__primary" aria-label="Footer navigation">
              <ul>
                {footerNav.map((section) => (
                  <li key={section.title}>
                    <span className="c-footer-nav__primary-section-title">
                      {section.title}
                    </span>
                    <ul>
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <a href={link.href}>{link.label}</a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className="c-footer-nav__social" aria-label="Social media links">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="c-footer-btn c-footer-btn--social"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  <span>{social.icon}</span>
                  <span aria-hidden="true">{social.icon}</span>
                </a>
              ))}
            </nav>

            <div className="c-footer-nav__legal">
              <p className="c-footer-nav__legal-eyebrow">
                Built for Malaysian service shops · Est 2025
              </p>
              <p className="c-footer-nav__legal-tagline">Queue calm.</p>
              <p className="c-footer-nav__legal-body">
                Miki Sdn Bhd
                <br />
                Kuala Lumpur, Malaysia
                <br />
                <a href="mailto:hello@miki.my">hello@miki.my</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function WaitlistStub() {
  return (
    <section id="waitlist" className="py-16 border-t border-black/5">
      <div className="container-page max-w-md mx-auto text-center">
        <h2 className="text-heading-sm text-ink m-0 mb-2">Join the waitlist</h2>
        <p className="text-body text-muted m-0 mb-6">
          Same platform. Different workflows. We&apos;ll email when yours launches.
        </p>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="Email"
            className="card-tint border-0 px-5 py-4 text-subheading text-ink placeholder:text-ash outline-none focus:ring-2 focus:ring-signal/30"
          />
          <input
            type="tel"
            placeholder="WhatsApp"
            className="card-tint border-0 px-5 py-4 text-subheading text-ink placeholder:text-ash outline-none focus:ring-2 focus:ring-signal/30"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 text-body-sm font-medium transition-colors cursor-pointer border-0 bg-signal text-paper px-4 py-4 rounded-[var(--radius-button)] hover:bg-signal-tint w-full"
          >
            Notify me
          </button>
        </form>
      </div>
    </section>
  )
}
