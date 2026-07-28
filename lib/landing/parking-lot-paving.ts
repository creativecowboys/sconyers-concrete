import type { LandingPage } from './types'

export const parkingLotPaving: LandingPage = {
  slug: 'commercial-parking-lot-paving-douglasville-ga',
  title: 'Commercial Parking Lot Paving in Douglasville, GA | Sconyers Concrete',
  description:
    'Commercial concrete parking lots for Douglasville shopping centers, medical offices, churches & office parks. 30+ years. Bonded & insured. Free estimates: 706-669-3089.',

  hero: {
    eyebrow: 'Douglas County Concrete Paving',
    lines: ['Parking Lot', 'Paving', 'Douglasville, GA'],
    sub: "Concrete parking lots outlast asphalt 3-to-1 in commercial use. We've been pouring them across Douglas County since 1994 — for shopping centers, medical offices, churches, restaurants, and office parks.",
    trustStrip:
      '30+ years · Bonded & insured · Free on-site estimates · Same-week response',
  },

  intro: {
    tag: 'Asphalt to Concrete Upgrade',
    heading: 'Douglasville Parking Lot Paving',
    paragraphs: [
      "Asphalt is the default. Concrete is the upgrade. If you own or operate a commercial property in Douglasville and you're tired of resealing, patching, and re-striping every couple of years — concrete parking lot paving pays for itself within 5–7 years on most commercial sites. Sconyers Concrete has been pouring commercial parking lots across Douglas County since 1994. We know which mixes hold up to Douglasville's clay soil and freeze-thaw cycles, where the drainage usually fails, and how to phase a pour so your tenants don't lose access for weeks at a time.",
      "Whether you're a developer pouring a new pad site, a property manager replacing a failed asphalt lot, or a GC bidding a build-to-suit for a national tenant — call <strong>706-669-3089</strong> for a free estimate, or use the form below.",
    ],
  },

  services: {
    tag: 'Paving Scopes',
    heading: 'Concrete Parking Lot Scopes',
    sub: 'From new builds to conversions, we cover the full commercial paving spectrum.',
    autoColumns: true,
    cards: [
      {
        image: '/images/concrete-paving.jpg',
        alt: 'Slipform paver placing a commercial concrete lane',
        title: 'New Construction Parking Lots',
        body: 'Full scope: subgrade prep, base prep, forming, rebar/mesh, pour, finish, joint sawing, and striping coordination. Engineered for new retail, hospitality, medical, and office developments.',
      },
      {
        // was about-team.jpg — a posed crew photo, and the truck in it is
        // branded "Atlanta Concrete Services".
        image: '/images/hero.jpg',
        alt: 'Crew placing and finishing a large exterior concrete pour',
        title: 'Asphalt-to-Concrete Conversions',
        body: 'Tear-out the failing asphalt, repair and compact the base, and pour a new concrete parking structure designed to last 30+ years. Phased to keep your business operating during the conversion.',
      },
      {
        image: '/images/power-screed.jpg',
        alt: 'Power screed levelling a fresh pour beside a mixer chute',
        title: 'Pavement Repair & Replacement',
        body: 'Sectional tear-out and replacement for failed panels, joint repairs, spall and crack remediation, and restriping coordination — phased so the lot keeps working.',
      },
      {
        image: '/images/finishing-crew.jpg',
        alt: 'Crew screeding and finishing a large commercial pour',
        title: 'Truck Courts & Loading Docks',
        body: 'The part of the lot that fails first. Dock aprons, trailer parking, refuse pads, and fire lanes poured in thicker sections at higher PSI, with jointing laid out for the turning loads they actually carry.',
      },
    ],
  },

  featureBand: {
    kind: 'comparison',
    tag: 'Analysis',
    heading: 'Concrete vs. Asphalt for Commercial Properties',
    intro:
      'Compare the long-term investment value of concrete paving compared to traditional asphalt.',
    columns: ['Factor', 'Asphalt', 'Concrete (Our Work)'],
    rows: [
      ['Useful life (commercial heavy use)', '8–12 years', '25–30+ years'],
      ['Maintenance (sealing, patching)', 'Every 2–3 years', 'Minimal'],
      ['Heat absorption (parking lot temp)', 'High (dark)', 'Lower (reflective)'],
      [
        'Heavy delivery / trash truck tolerance',
        'Rutting and cracking common',
        'Designed for it',
      ],
      ['Upfront cost', 'Lower', 'Higher'],
      ['20-year total cost', 'Often higher', 'Lower'],
    ],
  },

  localProof: {
    tag: 'Local Proof',
    heading: 'Douglas County Commercial Parking Lot Projects',
    paragraphs: [
      "We've poured parking infrastructure across Douglas County, targeting high-traffic corridors like the I-20 and Douglas Boulevard retail center corridors, office parks along Bright Star Road, and the medical office campus zones near Hospital Drive. We have the logistics capacity to handle commercial pours, ensuring ready-mix deliveries flow continuously without backing up local Douglasville traffic.",
    ],
    note: 'References from regional GCs and commercial property managers are available on request.',
  },

  whyUs: {
    tag: 'Why Sconyers',
    heading: 'Built Solid for Douglasville Paving',
    pillars: [
      {
        num: '01',
        title: 'Quality First',
        body: 'Proper base compaction, thick concrete pavement sections, and high-strength mix designs tailored to Georgia soils.',
      },
      {
        num: '02',
        title: 'Honest Pricing',
        body: 'Detailed estimates detailing cost allocations transparently, with no hidden mobilization charges.',
      },
      {
        num: '03',
        title: 'Proven Experience',
        body: 'Over 30 years experience routing concrete mixers, setting expansion joint intervals, and managing weather windows.',
      },
    ],
  },

  faq: {
    tag: 'FAQ',
    heading: 'Frequently Asked Questions',
    sub: 'Common questions about commercial concrete parking lot paving in Douglasville.',
    items: [
      {
        question: 'How long does a commercial concrete parking lot last?',
        answer: [
          'A commercial concrete parking lot typically lasts 25–30+ years with proper design and joint maintenance, vs. 8–12 years for asphalt under commercial loads. The long durability saves significantly on maintenance over time.',
        ],
      },
      {
        question: 'Can you phase a parking lot pour so my business stays open?',
        answer: [
          'Yes. Section-by-section phasing is standard for occupied commercial properties. We schedule work to ensure tenants and customers retain safe access routes throughout the project.',
        ],
      },
      {
        question: "What's the typical timeline for a new commercial parking lot?",
        answer: [
          'Typically 2–5 weeks of on-site work depending on size, plus cure time before opening to vehicle traffic. We can accelerate schedules for critical retail or health deadlines using high-early concrete mixes.',
        ],
      },
      {
        question: 'What PSI do you use for parking lots?',
        answer: [
          'Standard commercial paving is 4,000–4,500 PSI. We will spec higher (e.g. 5,000 PSI) for heavy industrial environments, loading docks, or garbage truck lane areas.',
        ],
      },
      {
        question: 'Do you handle the striping?',
        answer: [
          'We coordinate with line-striping subcontractors; we can recommend trusted partners or work with your existing contractors to handle full lane layout, ADA signage, and directional markings.',
        ],
      },
      {
        question: 'Do you do ADA-compliant accessible parking layout?',
        answer: [
          'Yes. Slope, access aisle width, van-accessible widths, and ramp transitions are all installed to current ADA standards to ensure inspections pass the first time.',
        ],
      },
      {
        question: 'Will you tear out the existing asphalt?',
        answer: [
          'Yes. We handle full tear-out, subgrade evaluation, subgrade repairs, base preparation, and concrete pour. We haul away the old asphalt for recycling.',
        ],
      },
      {
        question: 'Are you bonded and insured?',
        answer: [
          'Yes. We carry full general liability and workers compensation, and we provide certificates on request to facilitate contract approvals.',
        ],
      },
    ],
  },

  map: {
    tag: 'Winston Headquartered',
    heading: 'Serving Douglasville & West Georgia',
    body: 'We are headquartered in Winston, GA — just 10 minutes from downtown Douglasville. This allows prompt on-site assessments and reliable concrete delivery coordination.',
    alsoServeHeading: 'We also serve:',
    alsoServe: [
      'Newnan',
      'Carrollton',
      'Villa Rica',
      'Lithia Springs',
      'Dallas',
      'Hiram',
      'Winston',
      'Austell',
    ],
  },

  contact: {
    heading: 'Ready to Build Something Solid?',
    sub: "Call us or send a message — we'll get back to you fast with a free estimate. We serve Douglasville and the broader West Georgia region.",
    submitLabel: 'Get My Parking Lot Estimate',
    locationPlaceholder: 'Douglasville, 30135',
  },

  schema: {
    name: 'Commercial Parking Lot Paving',
    areaServed: 'Douglasville',
    serviceType: 'Commercial Parking Lot Paving',
    description:
      'Full-depth concrete parking lot paving, asphalt-to-concrete conversions, pavement replacement, and truck court construction in Douglasville, GA.',
  },
}
