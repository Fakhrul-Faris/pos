import {
  verticalBySlug,
  verticalCategories,
  verticalHref,
} from '../data/verticals'

export type NavMenuItem = {
  title: string
  description: string
  href: string
  live?: boolean
}

export type NavMenuColumn = {
  heading: string
  items: NavMenuItem[]
}

export type NavBusinessCategory = {
  id: string
  title: string
  tagline: string
  comingSoon?: boolean
  items: NavMenuItem[]
}

export const productMenu: NavMenuColumn[] = [
  {
    heading: 'Product',
    items: [
      {
        title: 'One screen',
        description: 'Bookings, queue, and checkout together',
        href: '#compare',
      },
      {
        title: 'How it works',
        description: 'Customer, counter, and owner on your device',
        href: '#how-it-works',
      },
      {
        title: 'Payments',
        description: 'Cash, cards, or QR — your choice',
        href: '#payments',
      },
    ],
  },
  {
    heading: 'Explore',
    items: [
      {
        title: 'Your business',
        description: 'Barbershop, salon, and clinic workflows',
        href: '#verticals',
      },
      {
        title: 'FAQ',
        description: 'Hardware, setup, and no contracts',
        href: '#faq',
      },
      {
        title: 'Start free',
        description: '14 days free · No card required',
        href: '#cta',
      },
    ],
  },
]

export const businessCategoriesMenu: NavBusinessCategory[] = verticalCategories.map(
  (category) => ({
    id: category.id,
    title: category.title,
    tagline: category.tagline,
    comingSoon:
      category.slugs.length === 0 ||
      ('comingSoon' in category && Boolean(category.comingSoon)),
    items: category.slugs.flatMap((slug) => {
      const vertical = verticalBySlug(slug)
      if (!vertical) return []

      return [
        {
          title: vertical.title,
          description: vertical.oneLiner,
          href: verticalHref(slug),
          live: vertical.live,
        },
      ]
    }),
  }),
)
