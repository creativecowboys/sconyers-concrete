/**
 * Google Ads landing pages, served at /go/<slug> and /go/<slug>/<city>.
 *
 * One page per ad group, so the headline repeats what the searcher typed and
 * the ad promised (the biggest single input to Quality Score's "landing page
 * experience" and "ad relevance"). The city variants exist so the city ad
 * groups can send "concrete contractor newnan" to a page whose H1 says Newnan.
 *
 * These pages are noindex and stay out of the sitemap: they exist for paid
 * traffic and would otherwise compete with the SEO pages under lib/landing.
 *
 * Every claim here is one the main site already makes (since 1994, 30+ years,
 * self-performed crews, bonded and insured with GL and workers comp, free
 * estimates, same-week response, the PSI ranges and equipment). Do not add
 * numbers, clients or credentials that Chip hasn't confirmed.
 */

export type AdCity = { slug: string; name: string }

/** Cities the ad groups target. Keep in step with the campaign's city ad group. */
export const adCities: AdCity[] = [
  { slug: 'atlanta', name: 'Atlanta' },
  { slug: 'douglasville', name: 'Douglasville' },
  { slug: 'newnan', name: 'Newnan' },
  { slug: 'carrollton', name: 'Carrollton' },
  { slug: 'villa-rica', name: 'Villa Rica' },
  { slug: 'marietta', name: 'Marietta' },
  { slug: 'dallas', name: 'Dallas' },
  { slug: 'fayetteville', name: 'Fayetteville' },
  { slug: 'peachtree-city', name: 'Peachtree City' },
  { slug: 'mcdonough', name: 'McDonough' },
  { slug: 'cumming', name: 'Cumming' },
  { slug: 'lagrange', name: 'LaGrange' },
]

export function getAdCity(slug: string): AdCity | undefined {
  return adCities.find((city) => city.slug === slug)
}

export type AdPage = {
  slug: string
  /** Shown in the browser tab; the city is appended for city variants. */
  title: string
  description: string
  /** Hero headline. `{city}` is replaced with " in Newnan, GA" or the region. */
  headline: string
  sub: string
  /** Three short proof points beside the form. */
  bullets: string[]
  /** Preselects the form's Project Type so the lead arrives categorised. */
  service: string
  submitLabel: string
  scope: {
    heading: string
    items: { title: string; body: string }[]
  }
  /** Two or three photos from /public/images that actually show this work. */
  photos: { src: string; alt: string; caption: string }[]
  faq: { q: string; a: string }[]
}

const PHOTOS = {
  laser: {
    src: '/images/laser-screed-paving.jpg',
    alt: 'Ride-on laser screed leveling a freshly placed commercial concrete slab',
    caption: 'Laser screed on a commercial placement',
  },
  pump: {
    src: '/images/foundation-pour.jpg',
    alt: 'Boom pump placing a large formed and reinforced building foundation',
    caption: 'Boom pump on a formed, reinforced foundation',
  },
  trowel: {
    src: '/images/concrete-slabs.jpg',
    alt: 'Power-trowelling an interior warehouse floor',
    caption: 'Power-trowelling a warehouse floor',
  },
  crew: {
    src: '/images/finishing-crew.jpg',
    alt: 'Crew screeding and finishing a large commercial pour',
    caption: 'Our own crew finishing a large pour',
  },
  slabCrew: {
    src: '/images/slab-crew.jpg',
    alt: 'Sconyers Concrete crew screeding a commercial slab beside a company truck',
    caption: 'Sconyers crew on a commercial slab',
  },
} as const

const COMMON_FAQ = {
  residential: {
    q: 'Do you do driveways or patios?',
    a: 'No. We are strictly commercial and industrial, and our crews are set up for that scale. For a home driveway or patio you will get a better price from a residential contractor.',
  },
  plans: {
    q: 'Can you price it from plans?',
    a: 'Yes. Send the drawings and specs through the form or call Chip. We will walk the site when it helps and come back with a firm number, free.',
  },
  area: {
    q: 'Where do you work?',
    a: 'Greater Atlanta and West Georgia, from our yard in Winston (Douglas County): Douglasville, Villa Rica, Carrollton, Newnan, Marietta, Fayetteville, McDonough and the rest of the metro.',
  },
}

export const adPages: AdPage[] = [
  {
    slug: 'commercial-concrete-contractor',
    title: 'Commercial Concrete Contractor',
    description:
      'Commercial concrete contractor for GCs and developers across Atlanta and West Georgia. Self-performed crews since 1994. Free estimates: 706-669-3089.',
    headline: 'Commercial Concrete Contractor{city}',
    sub: 'Slabs, foundations, parking lots and truck courts for general contractors, developers and facility owners. Our own crews run every pour, start to finish.',
    bullets: [
      'Commercial only, since 1994',
      'Self-performed crews, bonded and insured',
      'Free estimates, same-week response',
    ],
    service: '',
    submitLabel: 'Get My Free Estimate',
    scope: {
      heading: 'What we pour',
      items: [
        {
          title: 'Warehouse & industrial floors',
          body: "Slab-on-grade for distribution, manufacturing and light industrial buildings, poured to your engineer's reinforcement, joint layout and flatness spec.",
        },
        {
          title: 'Structural slabs & foundations',
          body: 'Formed and reinforced footings, grade beams and structural pours placed by boom pump, sequenced around your steel erector and site trades.',
        },
        {
          title: 'Parking lots & site paving',
          body: 'Full-depth concrete parking fields, drive aisles and access roads for retail centers, medical campuses and office parks.',
        },
        {
          title: 'Truck courts & loading docks',
          body: 'Dock aprons, trailer parking, refuse pads and fire lanes, poured thicker at higher PSI with jointing laid out for turning loads.',
        },
      ],
    },
    photos: [PHOTOS.laser, PHOTOS.pump, PHOTOS.trowel],
    faq: [COMMON_FAQ.residential, COMMON_FAQ.plans, COMMON_FAQ.area,
      {
        q: 'Do you sub to general contractors?',
        a: 'Most of our work is for GCs. We bid the concrete package, show up when the schedule says, and keep our crews on your job until the scope is done.',
      },
    ],
  },
  {
    slug: 'warehouse-concrete-floors',
    title: 'Warehouse & Industrial Concrete Floors',
    description:
      'Warehouse and industrial slab-on-grade floors poured to FF/FL spec by our own crews. Atlanta and West Georgia since 1994. Free estimates: 706-669-3089.',
    headline: 'Warehouse & Industrial Concrete Floors{city}',
    sub: "Slab-on-grade for distribution, manufacturing and light industrial buildings, poured to your engineer's reinforcement, joint layout and flatness spec.",
    bullets: [
      'Laser screed and power trowel',
      'Built for rack loads and forklift traffic',
      'Free estimates from plans',
    ],
    service: 'Warehouse / Industrial Floor',
    submitLabel: 'Price My Warehouse Floor',
    scope: {
      heading: 'One crew, one scope',
      items: [
        {
          title: 'Subgrade to sawcut',
          body: 'Subgrade prep, vapor barrier, reinforcement, pour, finish, joint sawing and curing run as one scope by the same crew.',
        },
        {
          title: 'Flatness and levelness',
          body: 'Where FF/FL is specified we use screeding, power troweling and laser alignment to hit the tolerance, and measure it on completion.',
        },
        {
          title: 'Mix and reinforcement to spec',
          body: 'Warehouse slabs often spec 4,500–5,000 PSI with fiber or rebar reinforcement. We pour what your engineer calls for.',
        },
        {
          title: 'Joint layout for the loads',
          body: 'Jointing laid out around racking, forklift aisles and dock doors rather than a generic grid.',
        },
      ],
    },
    photos: [PHOTOS.trowel, PHOTOS.laser, PHOTOS.crew],
    faq: [
      {
        q: 'Do you handle FF/FL flatness specs?',
        a: 'Yes. We screed, power trowel and use laser alignment to meet the specified tolerances, and flatness and levelness are measured at completion.',
      },
      COMMON_FAQ.plans,
      COMMON_FAQ.residential,
      COMMON_FAQ.area,
    ],
  },
  {
    slug: 'concrete-foundations',
    title: 'Commercial Concrete Foundations & Structural Slabs',
    description:
      'Commercial footings, grade beams and structural slabs placed by boom pump. Self-performed crews across Atlanta and West Georgia since 1994. 706-669-3089.',
    headline: 'Commercial Foundations & Structural Slabs{city}',
    sub: 'Formed and reinforced footings, grade beams and structural pours placed by boom pump, sequenced around your steel erector and site trades.',
    bullets: [
      'Form, reinforce, place and finish',
      'Boom pump placement',
      'Free estimates from plans',
    ],
    service: 'Structural Slab or Foundation',
    submitLabel: 'Price My Foundation',
    scope: {
      heading: 'What the scope covers',
      items: [
        {
          title: 'Footings & grade beams',
          body: 'Formed, reinforced and placed to the structural drawings, ready for your steel or masonry.',
        },
        {
          title: 'Structural slabs',
          body: 'Mix design, reinforcement and finish to the engineer’s spec, with pours sequenced to your schedule.',
        },
        {
          title: 'Placed by pump',
          body: 'Boom pump placement for large or hard-to-reach pours, so the trucks are not tearing up your site.',
        },
        {
          title: 'Our own crews',
          body: 'Strictly self-performed. The crew that forms the pour is the crew that places and finishes it.',
        },
      ],
    },
    photos: [PHOTOS.pump, PHOTOS.slabCrew, PHOTOS.crew],
    faq: [
      COMMON_FAQ.plans,
      {
        q: 'Do you self-perform or sub it out?',
        a: 'Self-perform. Our own crews form, place and finish every pour. We do not broker the work to another outfit.',
      },
      COMMON_FAQ.residential,
      COMMON_FAQ.area,
    ],
  },
  {
    slug: 'concrete-parking-lot-paving',
    title: 'Commercial Concrete Parking Lots',
    description:
      'Full-depth concrete parking lots, drive aisles and access roads for retail, medical and office sites. Atlanta and West Georgia since 1994. 706-669-3089.',
    headline: 'Commercial Concrete Parking Lots{city}',
    sub: 'Full-depth concrete parking fields, drive aisles and access roads for shopping centers, medical campuses, churches and office parks. Built for decades of traffic.',
    bullets: [
      'Poured to GDOT and municipal specs',
      'Laser screed placement',
      'Free on-site estimates',
    ],
    service: 'Parking Lot / Site Paving',
    submitLabel: 'Price My Parking Lot',
    scope: {
      heading: 'Paving built for the traffic',
      items: [
        {
          title: 'Parking fields & drive aisles',
          body: 'Standard commercial paving is 4,000–4,500 PSI, jointed for how cars and delivery trucks actually move through the lot.',
        },
        {
          title: 'Access roads & fire lanes',
          body: 'Thicker sections where the heavy vehicles run, poured to GDOT and municipal specs.',
        },
        {
          title: 'Walks & ADA ramps in the package',
          body: 'Sidewalks and ADA ramps tied into the paving contract, so one crew handles the site concrete.',
        },
        {
          title: 'Mix to the use',
          body: 'Mix design, aggregate and admixtures set for the site, with heavier sections at dumpster pads and delivery lanes.',
        },
      ],
    },
    photos: [PHOTOS.laser, PHOTOS.slabCrew, PHOTOS.crew],
    faq: [
      {
        q: 'Concrete or asphalt for a commercial lot?',
        a: 'Concrete costs more up front and lasts far longer with less maintenance, which is why medical campuses, retail centers and truck areas specify it. We only pour concrete.',
      },
      COMMON_FAQ.residential,
      COMMON_FAQ.plans,
      COMMON_FAQ.area,
    ],
  },
  {
    slug: 'truck-court-loading-dock',
    title: 'Concrete Truck Courts & Loading Docks',
    description:
      'Heavy-duty concrete truck courts, dock aprons, trailer parking and refuse pads. Self-performed crews, Atlanta and West Georgia since 1994. 706-669-3089.',
    headline: 'Concrete Truck Courts & Loading Docks{city}',
    sub: 'Heavy-duty pavement where the loads are worst: dock aprons, trailer parking, jockey lanes, refuse pads and fire lanes.',
    bullets: [
      'Thicker sections, higher PSI',
      'Jointing laid out for turning loads',
      'Free estimates from plans',
    ],
    service: 'Truck Court / Loading Dock',
    submitLabel: 'Price My Truck Court',
    scope: {
      heading: 'The heaviest scope we run',
      items: [
        {
          title: 'Dock aprons',
          body: 'Poured thicker at higher PSI, with jointing laid out around the turning radius rather than a generic grid.',
        },
        {
          title: 'Trailer parking & jockey lanes',
          body: 'Sections sized for parked trailers and the yard trucks that move them all day.',
        },
        {
          title: 'Refuse pads & equipment pads',
          body: 'Built for the point loads that break standard paving: dumpsters, compactors, generators and transformers.',
        },
        {
          title: 'Drained, not ponding',
          body: 'Graded so water is not sitting under the trailers and working into the joints.',
        },
      ],
    },
    photos: [PHOTOS.crew, PHOTOS.laser, PHOTOS.pump],
    faq: [
      {
        q: 'What PSI do you pour truck courts at?',
        a: 'Higher than a standard lot. Heavy industrial and dock areas often spec 4,500–5,000 PSI with fiber or rebar, and truck courts go thicker still. We pour what the engineer specifies.',
      },
      COMMON_FAQ.plans,
      COMMON_FAQ.residential,
      COMMON_FAQ.area,
    ],
  },
]

export function getAdPage(slug: string): AdPage | undefined {
  return adPages.find((page) => page.slug === slug)
}

/** " in Newnan, GA" for a city variant, " in Atlanta & West Georgia" otherwise. */
export function cityPhrase(city?: AdCity): string {
  return city ? ` in ${city.name}, GA` : ' in Atlanta & West Georgia'
}
