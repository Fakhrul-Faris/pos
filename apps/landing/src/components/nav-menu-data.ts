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
        title: 'How it works',
        description: 'Customer, counter, and owner — one business',
        href: '#how-it-works',
      },
      {
        title: 'Three leaks',
        description: 'At the door, rush hour, and close',
        href: '#why-miki',
      },
      {
        title: 'Your business',
        description: 'Workflows for how your shop runs',
        href: '#verticals',
      },
    ],
  },
  {
    heading: 'Explore',
    items: [
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
