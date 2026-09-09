import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The staff admin. Also noindex via metadata and an X-Robots-Tag header
      // from proxy.ts — this line just keeps crawlers from knocking.
      disallow: ['/admin', '/admin/'],
    },
    sitemap: `${site.url}/sitemap.xml`,
  }
}
