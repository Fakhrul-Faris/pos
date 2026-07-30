/** Miki POS motion tokens — aligned with prototype/motion springs */
export const spring = {
  natural: { type: 'spring' as const, stiffness: 280, damping: 28, mass: 0.9 },
  snappy: { type: 'spring' as const, stiffness: 320, damping: 30, mass: 0.8 },
  gentle: { type: 'spring' as const, stiffness: 240, damping: 30, mass: 1 },
  playful: { type: 'spring' as const, stiffness: 320, damping: 22, mass: 0.85 },
}

export const fade = {
  micro: { duration: 0.16, ease: [0.22, 1, 0.36, 1] as const },
  soft: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
}
