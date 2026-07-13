export const barbershopMeta = {
  title: 'Miki — Barbershop QR Booking & POS · Malaysia',
  description:
    'Walk-ins and online bookings on one counter tablet. Customers book from QR — no app. Cash and your own DuitNow. From RM109/mo. 14-day free trial.',
  ogHeadline: 'Walk-ins, bookings, one counter — finally in one system',
}

export const promoBanner =
  'First 50 barbershops per city: RM89/mo, locked for life. Full features. 14-day trial. No card.'

export const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Compare', href: '/compare' },
] as const

export const trustBarItems = [
  'Trusted by 100+ barbershops',
  'Works on iOS & Android',
  'Offline First',
  'No Extra Hardware',
] as const

export const problemBeats = [
  {
    id: 'stops',
    text: 'Most booking software stops at the appointment.',
    media: 'calendar',
    mediaLabel: 'Appointment only',
  },
  {
    id: 'miki',
    text: "Miki doesn't.",
    media: 'miki',
    mediaLabel: 'Miki',
    punch: true,
  },
  {
    id: 'saturday',
    text: "A busy Saturday isn't just a calendar.",
    media: 'shop',
    mediaLabel: 'Busy Saturday',
  },
  {
    id: 'walkins',
    text: 'Walk-ins arrive without warning.',
    media: 'walkin',
    mediaLabel: 'Walk-in',
  },
  {
    id: 'early',
    text: 'Booked customers show up early.',
    media: 'early',
    mediaLabel: 'Early arrival',
  },
  {
    id: 'addon',
    text: 'Someone wants to add a beard trim halfway through.',
    media: 'addon',
    mediaLabel: 'Add-on',
  },
  {
    id: 'owner',
    text: "The owner is cutting hair while checking who's next.",
    media: 'owner',
    mediaLabel: "Who's next",
  },
  {
    id: 'close',
    text: "Then there's payments, commissions and payroll before the day is over.",
    media: 'close',
    mediaLabel: 'Close of day',
  },
  {
    id: 'reality',
    text: "That's how barbershops actually run.",
    media: 'reality',
    mediaLabel: 'Real shop',
  },
  {
    id: 'built',
    text: "That's what Miki was built for.",
    media: 'built',
    mediaLabel: 'Built for this',
    punch: true,
  },
] as const

export const surfaces = [
  {
    key: 'customer',
    title: 'Customer web',
    subtitle: 'They book from the door',
    copy: 'Scan your QR. Pick a cut, a barber, a time. Get a number and a status page they can check without asking you. Name and phone. That\'s it.',
    image: '/mockup/Phone.png',
    alt: 'Customer booking from their phone',
  },
  {
    key: 'counter',
    title: 'Counter POS',
    subtitle: 'You run the chair',
    copy: 'One tablet, whole team. Tap the barber on duty. Mark arrived. Add a beard trim. Take payment. Switch barbers in one tap.',
    image: '/mockup/Tablet.jpg',
    alt: 'Staff tablet at the barbershop counter',
  },
  {
    key: 'owner',
    title: 'Owner web',
    subtitle: 'You own the day',
    copy: 'Services, hours, daily caps, walk-in blocks. Per-barber revenue at a glance. Print your QR. Export for your accountant.',
    image: '/mockup/Laptop.png',
    alt: 'Owner managing the shop from a laptop',
  },
] as const

export const byodRoles = [
  {
    role: 'Counter',
    note: 'you provide',
    copy: 'Shared tablet or phone at the counter. Whole team, one device.',
  },
  {
    role: 'Owner',
    note: 'you provide',
    copy: 'Phone, tablet, or laptop for calendar, caps, and reports.',
  },
  {
    role: 'Customers',
    note: 'they bring',
    copy: 'Their phone. Scan your QR. No app.',
  },
] as const

export const featureTips = [
  {
    id: 'walkins',
    text: 'Walk-ins and bookings. Finally working together.',
    body: 'One live queue and booking calendar. No double-booking chairs or guessing who\'s next.',
    image: '/mockup/Tablet.jpg',
  },
  {
    id: 'chairs',
    text: 'Keep every chair moving.',
    body: 'Assign the next customer in seconds. Who\'s waiting, who\'s cutting, which chair is ready.',
    image: '/mockup/Tablet.jpg',
  },
  {
    id: 'payments',
    text: 'Your phone is already your card terminal.',
    body: 'Cash, DuitNow QR, and tap-to-pay from the device you already own. No terminal rental.',
    image: '/mockup/Phone.png',
  },
  {
    id: 'addons',
    text: 'Don\'t lose revenue after the haircut starts.',
    body: 'Beard trim, pomade, and add-ons recorded at the chair, ready at checkout. No forgotten services, no missed sales.',
    image: '/mockup/Phone.png',
  },
  {
    id: 'payroll',
    text: 'Close the shop. Payroll is already done.',
    body: 'Every cut, product, and add-on tracked per barber. Commissions calculated before you lock up.',
    image: '/mockup/Laptop.png',
  },
  {
    id: 'queue-display',
    text: 'Customers already know when they\'re next.',
    body: 'Live queue on any screen. They see their place. Your team keeps cutting.',
    image: '/mockup/Tablet.jpg',
  },
  {
    id: 'offline',
    text: 'Even when the internet takes a break.',
    body: 'Check-ins, queue, and payments keep moving. Everything syncs when you\'re back online.',
    image: '/mockup/Laptop.png',
  },
] as const

export const features = [
  {
    title: 'QR booking',
    body: 'Customer scans, picks a service, books a slot. No app store. No account. Just a name and phone.',
  },
  {
    title: 'Now serving',
    body: 'Status page shows the shop\'s current number and theirs. They check their phone. You keep cutting.',
  },
  {
    title: 'Pick your barber',
    body: 'Customers pick and see availability. Or turn it off — system assigns the next free chair.',
  },
  {
    title: 'Hybrid walk-ins',
    body: 'Online bookings keep their slot. Walk-ins fill the gaps. Neither steals from the other.',
  },
  {
    title: 'Per-barber revenue',
    body: 'Every payment tied to whoever was switched in. Cuts and income per chair, every day.',
  },
] as const

export const featuresAlsoIncluded =
  'Also in every paid plan: add-ons at chair · walk-in-only blocks · daily caps · offline mode · digital receipt'

export const groupBookingsNote =
  'Group bookings — Dad and two sons? One booking, one queue number, one check-in.'

export const howItWorksSteps = [
  {
    id: 'shop',
    step: '01',
    title: 'Create your shop.',
    body: 'Add your business in minutes.',
    tone: 'neutral' as const,
    span: 'wide' as const,
  },
  {
    id: 'barbers',
    step: '02',
    title: 'Add your barbers and chairs.',
    body: 'Set your schedule once.',
    tone: 'lime' as const,
    span: 'narrow' as const,
  },
  {
    id: 'bookings',
    step: '03',
    title: 'Start accepting bookings and walk-ins.',
    body: "You're ready to go.",
    tone: 'ink' as const,
    span: 'narrow' as const,
  },
  {
    id: 'ready',
    step: '04',
    title: 'Under five minutes.',
    body: 'Most shops are up and running before the first customer walks in.',
    tone: 'neutral' as const,
    span: 'wide' as const,
  },
] as const

export const howItWorksIntro = {
  titleBefore: 'Ready before your',
  titleItalic: 'first customer.',
}

export type WhySwitchValue =
  | { kind: 'yes' }
  | { kind: 'no' }
  | { kind: 'text'; label: string }

export const whySwitchCompare: {
  feature: string
  miki: WhySwitchValue
  typical: WhySwitchValue
}[] = [
  {
    feature: 'Online Bookings',
    miki: { kind: 'yes' },
    typical: { kind: 'yes' },
  },
  {
    feature: 'Walk-in Queue',
    miki: { kind: 'yes' },
    typical: { kind: 'text', label: 'Limited' },
  },
  {
    feature: 'Queue + Booking Together',
    miki: { kind: 'yes' },
    typical: { kind: 'no' },
  },
  {
    feature: 'Chair Assignment',
    miki: { kind: 'yes' },
    typical: { kind: 'no' },
  },
  {
    feature: 'Offline Mode',
    miki: { kind: 'yes' },
    typical: { kind: 'text', label: 'Rare' },
  },
  {
    feature: 'Barber Commissions',
    miki: { kind: 'yes' },
    typical: { kind: 'text', label: 'Usually Add-on' },
  },
  {
    feature: 'Hardware Required',
    miki: { kind: 'text', label: 'None' },
    typical: { kind: 'text', label: 'Often Required' },
  },
  {
    feature: 'Flat Monthly Pricing',
    miki: { kind: 'yes' },
    typical: { kind: 'text', label: 'Usually Per Staff' },
  },
]

export const pricingTiers = [
  {
    id: 'ocelot',
    name: 'Ocelot',
    price: 'RM109',
    period: '/month',
    badge: null,
    tagline: 'Perfect for growing barbershops.',
    highlights: [
      'Up to 4 barbers',
      'Unlimited bookings',
      'Walk-ins + Queue',
      'Chair assignment',
      'Offline mode',
      'Payroll tracking',
      'Cash, QR & Card',
      'Email support',
    ],
    note: null,
  },
  {
    id: 'mantis',
    name: 'Mantis',
    price: 'RM199',
    period: '/month',
    badge: 'Most Popular',
    tagline: 'Everything in Ocelot plus:',
    highlights: [
      'Up to 8 barbers',
      '2 locations',
      'Commission dashboard',
      'Payroll export',
      'Group bookings',
      'Priority WhatsApp support',
    ],
    note: null,
  },
  {
    id: 'patriot',
    name: 'Patriot',
    price: 'RM349',
    period: '/month',
    badge: null,
    tagline: 'Everything in Mantis plus:',
    highlights: [
      'Unlimited barbers',
      'Unlimited locations',
      'HQ dashboard',
      'Cross-branch reporting',
      'MyInvois exports',
      'Dedicated onboarding',
      'SLA support',
    ],
    note: null,
  },
] as const

export const pricingIntro = {
  titleBefore: 'Simple pricing that',
  titleItalic: 'grows with your shop.',
  sub: 'No contracts. No hidden fees. Upgrade whenever you\'re ready.',
}

export const faqItems = [
  {
    q: 'Why Miki instead of Fresha?',
    a: 'Most booking software focuses on appointments. Miki helps you run the entire barbershop, from walk-ins and chair assignment to checkout and payroll.',
  },
  {
    q: 'How long does setup take?',
    a: 'Most shops are ready in under five minutes.',
  },
  {
    q: 'Can I switch from another platform?',
    a: "Yes. We'll help you move your bookings and customer data.",
  },
  {
    q: 'Can I upgrade later?',
    a: 'Anytime. Your data moves with you. No setup required.',
  },
  {
    q: 'What devices work with Miki?',
    a: 'Any iPhone, iPad or Android phone or tablet. If your device supports NFC, it can accept tap-to-pay cards. No dedicated card terminal required.',
  },
  {
    q: 'What if my internet goes down?',
    a: "Your shop keeps running. Everything syncs automatically once you're back online.",
  },
  {
    q: "What if Miki isn't for me?",
    a: 'Cancel anytime. No contracts. No hard feelings.',
  },
] as const

export const testimonials = [
  {
    quote:
      'Saturday used to mean three different apps. Now we open Miki and that\'s it.',
    name: 'Akmal',
    title: 'Owner, The Gentleman\'s Reserve',
  },
  {
    quote: 'The live queue alone made the switch worth it.',
    name: 'Rizal',
    title: 'Owner, Cut & Co.',
  },
  {
    quote:
      'Payroll went from almost two hours to less than fifteen minutes.',
    name: 'Farid',
    title: 'Owner, Dummy Barbershop',
  },
] as const

export const closingCta = {
  headline: 'Stop juggling three different apps.',
  beats: ['Bookings.', 'Walk-ins.', 'Payments.', 'Payroll.'],
  body: 'Everything finally works together.',
  cta: 'Start for free',
  sub: 'No card required. No contract.',
}

export const footerTagline = 'Queue, booking, and checkout for barbershops.'
