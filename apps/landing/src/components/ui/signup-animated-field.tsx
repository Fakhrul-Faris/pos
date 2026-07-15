'use client'

import {
  type ChangeEvent,
  type InputHTMLAttributes,
  useEffect,
  useId,
  useState,
} from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useReducedMotionSafe } from '../../hooks/use-reduced-motion-safe'

type SignupAnimatedFieldProps = {
  label: string
  name: string
  type?: 'text' | 'email' | 'password'
  autoComplete?: string
  required?: boolean
  minLength?: number
  validate?: (value: string) => boolean
  className?: string
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'name' | 'className' | 'placeholder' | 'value' | 'defaultValue'
>

function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function defaultFieldValid(
  value: string,
  type: 'text' | 'email' | 'password',
  minLength = 1,
) {
  const trimmed = value.trim()
  if (type === 'email') return isEmailValid(value)
  if (type === 'password') return value.length >= Math.max(minLength, 8)
  return trimmed.length >= minLength
}

function borderForState(opts: {
  pulsing: boolean
  focused: boolean
  valid: boolean
  hasValue: boolean
}) {
  if (opts.pulsing) {
    return 'color-mix(in srgb, var(--color-electric-lime) 88%, transparent)'
  }
  if (opts.focused) {
    return 'color-mix(in srgb, var(--color-electric-lime) 55%, transparent)'
  }
  if (opts.valid && opts.hasValue) {
    return 'color-mix(in srgb, var(--color-electric-lime) 38%, transparent)'
  }
  return 'color-mix(in srgb, var(--color-ivory) 14%, transparent)'
}

export function SignupAnimatedField({
  label,
  name,
  type = 'text',
  autoComplete,
  required,
  minLength,
  validate,
  className,
  id: idProp,
  onChange,
  onFocus,
  onBlur,
  ...rest
}: SignupAnimatedFieldProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId
  const reduceMotion = useReducedMotionSafe()

  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [pulsing, setPulsing] = useState(false)

  const floated = focused || value.length > 0
  const hasValue = value.length > 0
  const isValid = validate
    ? validate(value)
    : defaultFieldValid(value, type, minLength ?? 1)

  useEffect(() => {
    if (!pulsing) return
    const t = window.setTimeout(() => setPulsing(false), 55)
    return () => window.clearTimeout(t)
  }, [pulsing, value])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
    if (!reduceMotion) setPulsing(true)
    onChange?.(e)
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn('signup-field', className)}>
        <motion.div
          className={cn(
            'signup-field__shell',
            focused && 'signup-field__shell--focused',
            isValid && hasValue && 'signup-field__shell--valid',
          )}
          animate={{
            borderColor: borderForState({
              pulsing,
              focused,
              valid: isValid,
              hasValue,
            }),
            backgroundColor: focused
              ? 'color-mix(in srgb, var(--color-pure-white) 9%, transparent)'
              : 'color-mix(in srgb, var(--color-pure-white) 6%, transparent)',
            boxShadow: pulsing
              ? '0 0 0 3px color-mix(in srgb, var(--color-electric-lime) 28%, transparent)'
              : '0 0 0 0 transparent',
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 360, damping: 28, mass: 0.7 }
          }
        >
          <motion.label
            htmlFor={id}
            className="signup-field__label"
            animate={
              floated
                ? { y: -12, scale: 0.76, opacity: 1 }
                : { y: 0, scale: 1, opacity: 0.68 }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 420, damping: 28, mass: 0.65 }
            }
          >
            {label}
            {required ? ' *' : null}
          </motion.label>

          <input
            {...rest}
            id={id}
            name={name}
            type={type}
            required={required}
            minLength={minLength}
            autoComplete={autoComplete}
            value={value}
            className="signup-field__input"
            placeholder=" "
            onChange={handleChange}
            onFocus={(e) => {
              setFocused(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              onBlur?.(e)
            }}
          />

          <AnimatePresence>
            {isValid && hasValue ? (
              <motion.span
                className="signup-field__check"
                aria-hidden
                initial={reduceMotion ? false : { opacity: 0, scale: 0.55 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.7 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 420, damping: 22 }
                }
              >
                <Check className="signup-field__check-icon" strokeWidth={2.5} />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </MotionConfig>
  )
}
