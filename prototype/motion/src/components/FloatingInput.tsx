import { useId, useState } from 'react'
import { motion } from 'motion/react'
import { spring } from '@/motion/springs'

type FloatingInputProps = {
  label: string
  type?: string
  autoComplete?: string
  value?: string
  onChange?: (value: string) => void
}

export function FloatingInput({
  label,
  type = 'text',
  autoComplete,
  value: controlledValue,
  onChange,
}: FloatingInputProps) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const [internalValue, setInternalValue] = useState('')
  const value = controlledValue ?? internalValue
  const active = focused || value.length > 0

  function handleChange(next: string) {
    if (controlledValue === undefined) setInternalValue(next)
    onChange?.(next)
  }

  return (
    <div className="relative">
      <motion.input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="peer w-full rounded-xl border border-black/10 bg-[#F6F5F4] px-4 pb-3 pt-6 text-base text-[#1C1C1C] outline-none transition-colors focus:border-[#1C1C1C] focus:bg-white"
        animate={{ y: active ? -2 : 0 }}
        transition={spring.natural}
      />
      <motion.label
        htmlFor={id}
        className="pointer-events-none absolute left-4 origin-left text-[#0000008A]"
        animate={{
          y: active ? 8 : 18,
          scale: active ? 0.78 : 1,
          color: active ? '#1A7A4C' : '#0000008A',
        }}
        transition={spring.natural}
      >
        {label}
      </motion.label>
    </div>
  )
}
