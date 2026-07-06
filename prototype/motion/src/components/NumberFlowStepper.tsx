import { motion } from 'motion/react'
import { MinusIcon, PlusIcon } from '@heroicons/react/24/solid'
import { NumberFlowField } from './NumberFlowField'
import stepperStyles from './NumberFlowStepper.module.css'
import { spring } from '@/motion/springs'

type NumberFlowStepperProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  suffix?: string
  className?: string
}

export function NumberFlowStepper({
  value,
  onChange,
  min = 1,
  max = 6,
  label,
  suffix = 'people',
  className = '',
}: NumberFlowStepperProps) {
  function decrement() {
    onChange(Math.max(min, value - 1))
  }

  function increment() {
    onChange(Math.min(max, value + 1))
  }

  return (
    <div className={`${stepperStyles.wrap} ${className}`}>
      {label ? <p className={stepperStyles.label}>{label}</p> : null}
      <div className={stepperStyles.row}>
        <StepperButton onClick={decrement} disabled={value <= min} aria-label="Decrease">
          <MinusIcon className="h-4 w-4" />
        </StepperButton>

        <div className={stepperStyles.value}>
          <NumberFlowField
            value={value}
            onChange={(v) => {
              if (v === undefined) return
              onChange(Math.min(max, Math.max(min, Math.round(v))))
            }}
            decimalScale={0}
            maxLength={1}
            size="md"
            aria-label={label ?? 'Party size'}
          />
          {suffix ? <span className={stepperStyles.suffix}>{suffix}</span> : null}
        </div>

        <StepperButton onClick={increment} disabled={value >= max} aria-label="Increase">
          <PlusIcon className="h-4 w-4" />
        </StepperButton>
      </div>
    </div>
  )
}

function StepperButton({
  children,
  onClick,
  disabled,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  'aria-label'?: string
}) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={stepperStyles.stepBtn}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      transition={spring.snappy}
    >
      {children}
    </motion.button>
  )
}
