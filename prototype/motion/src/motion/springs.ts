/** Miki motion tokens — natural Apple-like springs, moderate restraint */
export const spring = {
  natural: { type: 'spring' as const, stiffness: 280, damping: 28, mass: 0.9 },
  snappy: { type: 'spring' as const, stiffness: 320, damping: 30, mass: 0.8 },
  gentle: { type: 'spring' as const, stiffness: 240, damping: 30, mass: 1 },
  /** Selective bounce — nav pills, celebration only */
  playful: { type: 'spring' as const, stiffness: 320, damping: 22, mass: 0.85 },
}

export const stagger = {
  delay: 0.06,
  maxTotal: 0.6,
}
