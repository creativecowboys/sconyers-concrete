/**
 * Content model for the West Georgia SEO landing pages.
 *
 * Every page shares the same section order; the optional blocks below are the
 * only structural differences between them (the four city pages carry a
 * process block, the three service pages carry a comparison table or a
 * compliance block instead).
 *
 * Paragraph strings may contain `<strong>…</strong>`, which `RichText` renders.
 */

export type ServiceCard = {
  image: string
  alt: string
  title: string
  body: string
}

export type Pillar = {
  num: string
  title: string
  body: string
}

export type ProcessStep = {
  title: string
  body: string
}

export type FaqItem = {
  question: string
  answer: string[]
}

/**
 * The band that sits between Services and Local Proof on the three service
 * pages. Each page uses exactly one of these shapes.
 */
export type FeatureBand =
  | {
      kind: 'comparison'
      tag: string
      heading: string
      intro: string
      columns: string[]
      rows: string[][]
    }
  | {
      kind: 'compliance'
      tag: string
      heading: string
      intro: string
      block: { heading: string; items: string[] }
      outro: string
    }
  | {
      kind: 'steps'
      tag: string
      heading: string
      intro: string
      steps: ProcessStep[]
    }

export type LandingPage = {
  slug: string
  /** <title> — used verbatim, so it is not run through the layout title template. */
  title: string
  description: string

  hero: {
    eyebrow: string
    lines: [string, string, string]
    sub: string
    trustStrip: string
  }

  intro: {
    tag: string
    heading: string
    paragraphs: string[]
  }

  services: {
    tag: string
    heading: string
    sub: string
    cards: ServiceCard[]
    /** Service pages use auto-fit columns for their four cards. */
    autoColumns?: boolean
  }

  /** Service pages only — sits between Services and Local Proof. */
  featureBand?: FeatureBand

  localProof: {
    tag: string
    heading: string
    paragraphs: string[]
    note?: string
  }

  whyUs: {
    tag: string
    heading: string
    pillars: Pillar[]
  }

  /** City pages only — sits after Why Us. */
  process?: {
    tag: string
    heading: string
    steps: ProcessStep[]
  }

  faq: {
    tag: string
    heading: string
    sub: string
    items: FaqItem[]
  }

  map: {
    tag: string
    heading: string
    body: string
    alsoServeHeading: string
    alsoServe: string[]
  }

  contact: {
    heading: string
    sub: string
    submitLabel: string
    locationPlaceholder: string
  }

  /**
   * Only the Service block varies per page — the GeneralContractor and
   * FAQPage blocks are generated from `lib/schema.ts` and the FAQ items above.
   */
  schema: {
    name: string
    /** A single city, or the full service area for the region-wide ADA page. */
    areaServed: string | string[]
    serviceType: string
    description: string
  }
}
