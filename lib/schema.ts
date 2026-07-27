import type { LandingPage } from './landing'
import { site } from './site'

const SERVICE_AREA_CITIES = [
  'Douglasville',
  'Newnan',
  'Carrollton',
  'Villa Rica',
  'LaGrange',
  'Dallas',
  'Hiram',
]

const OFFER_CATALOG_SERVICES = [
  'Commercial Concrete Slabs',
  'Commercial Concrete Paving',
  'Curbs and Gutters',
  'Commercial Sidewalks',
  'ADA Handicap Ramps',
  'Commercial Concrete Stairs',
]

/** The GeneralContractor block — identical on every landing page. */
export function generalContractorSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'GeneralContractor',
    name: site.name,
    image: `${site.url}/images/logo.png`,
    '@id': `${site.url}/#organization`,
    url: `${site.url}/`,
    telephone: site.phoneE164,
    email: site.email,
    priceRange: '$$',
    foundingDate: site.foundingDate,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.street,
      addressLocality: site.city,
      addressRegion: site.region,
      postalCode: site.postalCode,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: site.geo.latitude,
      longitude: site.geo.longitude,
    },
    areaServed: SERVICE_AREA_CITIES.map((name) => ({ '@type': 'City', name })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Commercial Concrete Services',
      itemListElement: OFFER_CATALOG_SERVICES.map((name) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name },
      })),
    },
  }
}

export function serviceSchema(page: LandingPage) {
  const { areaServed } = page.schema
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.schema.name,
    provider: {
      '@type': 'GeneralContractor',
      name: site.name,
    },
    areaServed: Array.isArray(areaServed)
      ? areaServed.map((name) => ({ '@type': 'City', name }))
      : { '@type': 'City', name: areaServed },
    serviceType: page.schema.serviceType,
    description: page.schema.description,
  }
}

export function faqSchema(page: LandingPage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer.join(' '),
      },
    })),
  }
}

export function breadcrumbSchema(page: LandingPage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${site.url}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Services',
        item: `${site.url}/${page.slug}`,
      },
    ],
  }
}
