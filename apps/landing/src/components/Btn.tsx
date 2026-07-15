import type { ButtonHTMLAttributes, ReactNode } from 'react'

type BtnVariant = 'nav' | 'hero' | 'default' | 'block' | 'inverse'

type BtnProps = {
  children: ReactNode
  variant?: BtnVariant
  href?: string
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

const variantClass: Record<BtnVariant, string> = {
  nav: 'btn--nav',
  hero: 'btn--hero',
  default: 'btn--default',
  block: 'btn--block',
  inverse: 'btn--inverse',
}

function BtnContent({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="btn__bg" aria-hidden="true" />
      <span className="btn__label">{children}</span>
    </>
  )
}

export function Btn({
  children,
  variant = 'default',
  href,
  className = '',
  ...props
}: BtnProps) {
  const classes = `btn ${variantClass[variant]} ${className}`.trim()

  if (href) {
    return (
      <a href={href} className={classes}>
        <BtnContent>{children}</BtnContent>
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      <BtnContent>{children}</BtnContent>
    </button>
  )
}
