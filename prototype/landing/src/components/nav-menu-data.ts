import { verticals, verticalHref } from '../data/verticals'

export type NavMenuItem = {
  title: string
  description: string
  href: string
}

export type NavMenuColumn = {
  heading: string
  items: NavMenuItem[]
}

export const productMenu: NavMenuColumn[] = [
  {
    heading: 'Guides',
    items: [
      {
        title: 'How it works',
        description: 'QR to paid receipt in one afternoon',
        href: '#how-it-works',
      },
      {
        title: 'Three surfaces',
        description: 'Customer, counter, and owner web',
        href: '#how-it-works',
      },
      {
        title: 'Setup checklist',
        description: 'Services, staff, hours, print QR',
        href: '#features',
      },
    ],
  },
  {
    heading: 'Tools',
    items: [
      {
        title: 'Features',
        description: 'Book, queue, pay, report, sync',
        href: '#features',
      },
      {
        title: 'Compare StoreHub',
        description: 'Built for service shops, not retail',
        href: '#compare',
      },
      {
        title: 'Payments',
        description: 'Cash, DuitNow, integrated QR',
        href: '#payments',
      },
    ],
  },
  {
    heading: 'Businesses',
    items: verticals.map((vertical) => ({
      title: vertical.title,
        description: vertical.live ? 'Live' : 'Soon · join waitlist',
      href: verticalHref(vertical.slug),
    })),
  },
]

export const businessesMenu: NavMenuColumn[] = [
  {
    heading: 'Available now',
    items: verticals
      .filter((vertical) => vertical.live)
      .map((vertical) => ({
        title: vertical.title,
        description: vertical.oneLiner,
        href: verticalHref(vertical.slug),
      })),
  },
  {
    heading: 'Coming soon',
    items: verticals
      .filter((vertical) => !vertical.live)
      .map((vertical) => ({
        title: vertical.title,
        description: vertical.oneLiner,
        href: verticalHref(vertical.slug),
      })),
  },
]
