export const verticals = [
  {
    slug: 'barbershop',
    title: 'Barbershop & salon',
    badge: 'Live',
    live: true,
    oneLiner: 'Chairs, queues, bookings',
    bg: 'bg-mint/40',
    accent: 'text-emerald',
  },
  {
    slug: 'clinic',
    title: 'Clinic & aesthetic',
    badge: 'Soon',
    live: false,
    oneLiner: 'Appointments without the bloat',
    bg: 'bg-cobalt/10',
    accent: 'text-cobalt',
  },
  {
    slug: 'cafe',
    title: 'F&B & café',
    badge: 'Soon',
    live: false,
    oneLiner: 'Counter and table, not franchise HQ',
    bg: 'bg-coral/10',
    accent: 'text-coral',
  },
  {
    slug: 'retail',
    title: 'Retail & pop-up',
    badge: 'Soon',
    live: false,
    oneLiner: 'Catalogue and checkout, not a warehouse',
    bg: 'bg-citrus/60',
    accent: 'text-signal',
  },
] as const

export type Vertical = (typeof verticals)[number]

export function verticalHref(slug: string) {
  return `/${slug}`
}
