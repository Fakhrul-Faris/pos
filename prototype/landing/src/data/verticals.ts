export const verticals = [
  {
    slug: 'barbershop',
    title: 'Barbershop',
    badge: 'Live',
    live: true,
    oneLiner:
      'Manage chairs, split commissions by barber, and take walk-ins without the wait.',
    bg: 'bg-mint/40',
    accent: 'text-emerald',
  },
  {
    slug: 'salon',
    title: 'Salon & Spa',
    badge: 'Live',
    live: true,
    oneLiner:
      'Track stylists, manage room bookings, and checkout clients in seconds.',
    bg: 'bg-cobalt/10',
    accent: 'text-cobalt',
  },
  {
    slug: 'clinic',
    title: 'Aesthetics & Clinic',
    badge: 'Soon',
    live: false,
    oneLiner:
      'Handle patient flow, staff scheduling, and seamless package upsells.',
    bg: 'bg-coral/10',
    accent: 'text-coral',
  },
] as const

export type Vertical = (typeof verticals)[number]

export const verticalCategories = [
  {
    id: 'beauty',
    title: 'Beauty',
    tagline: 'Every chair, always working.',
    theme: 'beauty',
    slugs: ['barbershop', 'salon', 'clinic'] as const,
  },
  {
    id: 'fnb',
    title: 'Food & Beverage',
    tagline: 'Every order, one screen.',
    theme: 'fnb',
    slugs: [] as const,
    comingSoon: true,
  },
  {
    id: 'retail',
    title: 'Retail',
    tagline: 'Every sale, counted.',
    theme: 'retail',
    slugs: [] as const,
    comingSoon: true,
  },
] as const

export type VerticalCategory = (typeof verticalCategories)[number]

export function verticalHref(slug: string) {
  if (slug === 'salon') return '/barbershop'
  return `/${slug}`
}

export function verticalBySlug(slug: string) {
  return verticals.find((v) => v.slug === slug)
}
