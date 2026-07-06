import { NumberFlowInput } from '@daformat/react-number-flow-input'
import styles from './NumberFlowField.module.css'

type NumberFlowFieldProps = {
  value: number | undefined
  onChange?: (value: number | undefined) => void
  prefix?: string
  placeholder?: string
  decimalScale?: number
  maxLength?: number
  readOnly?: boolean
  size?: 'md' | 'lg' | 'xl'
  tone?: 'default' | 'light'
  className?: string
  'aria-label'?: string
}

export function NumberFlowField({
  value,
  onChange,
  prefix,
  placeholder = '0',
  decimalScale = 0,
  maxLength,
  readOnly = false,
  size = 'xl',
  className = '',
  tone = 'default',
  'aria-label': ariaLabel,
}: NumberFlowFieldProps) {
  return (
    <div
      data-number-flow=""
      className={`${styles.field} ${styles[size]} ${tone === 'light' ? styles.light : ''} ${readOnly ? styles.readOnly : ''} ${className}`}
    >
      {prefix ? (
        <span className={styles.prefix} aria-hidden>
          {prefix}
        </span>
      ) : null}
      <NumberFlowInput
        value={value}
        onChange={readOnly ? undefined : onChange}
        placeholder={placeholder}
        decimalScale={decimalScale}
        maxLength={maxLength}
        className={styles.input}
        aria-label={ariaLabel}
      />
    </div>
  )
}
