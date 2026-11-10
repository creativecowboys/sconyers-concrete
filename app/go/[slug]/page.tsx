import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AdLandingPage from '@/components/ads/AdLandingPage'
import { adPages, getAdPage } from '@/lib/ads/pages'

/** Google Ads landing pages. Static, noindex, and kept out of the sitemap. */
export const dynamicParams = false

export function generateStaticParams() {
  return adPages.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata(props: PageProps<'/go/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const page = getAdPage(slug)
  if (!page) return {}
  return {
    title: { absolute: `${page.title} | Sconyers Concrete` },
    description: page.description,
    robots: { index: false, follow: false },
  }
}

export default async function AdRoute(props: PageProps<'/go/[slug]'>) {
  const { slug } = await props.params
  const page = getAdPage(slug)
  if (!page) notFound()
  return <AdLandingPage page={page} />
}
