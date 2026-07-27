import type { MetadataRoute } from 'next'
import { landingPages } from '@/lib/landing'
import { site } from '@/lib/site'

/** Kept in sync with the priorities the old static sitemap.xml carried. */
const LANDING_PRIORITY: Record<string, number> = {
  'commercial-concrete-contractor-douglasville-ga': 0.9,
  'commercial-concrete-contractor-newnan-ga': 0.9,
  'commercial-concrete-contractor-carrollton-ga': 0.9,
  'commercial-concrete-contractor-villa-rica-ga': 0.9,
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${site.url}/`,
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${site.url}/contact`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...landingPages.map((page) => ({
      url: `${site.url}/${page.slug}`,
      changeFrequency: 'monthly' as const,
      priority: LANDING_PRIORITY[page.slug] ?? 0.8,
    })),
  ]
}
