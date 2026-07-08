import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { Btn } from './Btn'

type ButtonVariant = 'primary' | 'ghost' | 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
  href?: string
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  href,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 text-body-sm font-medium transition-colors cursor-pointer border-0'

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-signal text-paper px-4 py-2 rounded-[var(--radius-button)] hover:bg-signal-tint',
    ghost: 'bg-transparent text-signal px-2 py-2 rounded-lg hover:bg-linen',
    outline:
      'bg-transparent text-signal border border-signal px-4 py-2 rounded-[var(--radius-button)] hover:bg-linen',
  }

  const classes = `${base} ${variants[variant]} ${className}`.trim()

  if (variant === 'primary') {
    if (href) {
      return (
        <Btn href={href} variant="default" className={className}>
          {children}
        </Btn>
      )
    }

    return (
      <Btn variant="default" className={className} {...props}>
        {children}
      </Btn>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}

export function ArrowLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 text-signal text-body-sm font-medium tracking-[0.03em] px-2 py-2 rounded-lg hover:bg-linen transition-colors"
    >
      {children}
      <span aria-hidden>→</span>
    </a>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-caption text-muted uppercase tracking-[0.12em] mb-4">
      {children}
    </p>
  )
}

export function ItalicHeadline({
  before,
  italic,
  after,
  className = '',
}: {
  before: string
  italic: string
  after?: string
  className?: string
}) {
  return (
    <h2 className={`text-heading-lg text-ink ${className}`.trim()}>
      {before}
      <span className="italic-beat"> {italic}</span>
      {after}
    </h2>
  )
}
