'use client'

import {
  type ButtonHTMLAttributes,
  type ReactNode,
  forwardRef,
} from 'react'

type Variant = 'default' | 'secondary' | 'tertiary' | 'error' | 'warning'
type Size = 'tiny' | 'small' | 'medium' | 'large'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  prefix?: ReactNode
  suffix?: ReactNode
  svgOnly?: boolean
  shape?: 'square' | 'circle' | 'rounded'
  shadow?: boolean
}

const sizeClass: Record<Size, string> = {
  tiny: 'h-6 px-2 text-xs',
  small: 'h-8 px-2.5 text-xs',
  medium: 'h-9 px-3 text-sm',
  large: 'h-11 px-4 text-sm',
}

const svgSizeClass: Record<Size, string> = {
  tiny: 'h-6 w-6',
  small: 'h-8 w-8',
  medium: 'h-9 w-9',
  large: 'h-11 w-11',
}

const variantClass: Record<Variant, string> = {
  default:
    'border-gray-1000 bg-gray-1000 text-background hover:bg-white hover:border-white',
  secondary:
    'border-gray-400 bg-transparent text-gray-1000 hover:bg-gray-200 hover:border-gray-500',
  tertiary:
    'border-transparent bg-transparent text-gray-900 hover:bg-gray-200 hover:text-gray-1000',
  error:
    'border-red-700 bg-red-700 text-white hover:bg-red-800 hover:border-red-800',
  warning:
    'border-amber-700 bg-amber-700 text-background hover:brightness-110',
}

/**
 * Local Button mirroring @vercel/geistcn Button API.
 * Package is not on public npm — see https://vercel.com/geist/button
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'default',
      size = 'medium',
      loading,
      prefix,
      suffix,
      svgOnly,
      shape,
      shadow,
      className = '',
      children,
      disabled,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const rounded =
      shape === 'circle'
        ? 'rounded-full'
        : shape === 'rounded'
          ? 'rounded-full'
          : 'rounded-[6px]'

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={[
          'inline-flex items-center justify-center gap-1.5 border font-medium tracking-ui transition disabled:cursor-not-allowed disabled:opacity-50',
          svgOnly ? svgSizeClass[size] : sizeClass[size],
          variantClass[variant],
          rounded,
          shadow ? 'shadow-panel' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {loading ? (
          <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-current opacity-60" />
        ) : (
          prefix
        )}
        {children}
        {!loading && suffix}
      </button>
    )
  },
)
