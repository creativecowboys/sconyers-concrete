import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AdLandingPage from '@/components/ads/AdLandingPage'
import { adCities, adPages, getAdCity, getAdPage } from '@/lib/ads/pages'

/**
 * City variants of the Google Ads pages (/go/<slug>/<city>), so a city ad
 * group can land on a headline naming that city. Static and noindex.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return adPages.flatMap((page) => adCities.map((city) => ({ slug: page.slug, city: city.slug })))
}

export async function generateMetadata(
  props: PageProps<'/go/[slug]/[city]'>
): Promise<Metadata> {
  const { slug, city: citySlug } = await props.params
  const page = getAdPage(slug)
  const city = getAdCity(citySlug)
  if (!page || !city) return {}
  return {
    title: { absolute: `${page.title} in ${city.name}, GA | Sconyers Concrete` },
    description: page.description,
    robots: { index: false, follow: false },
  }
}

export default async function AdCityRoute(props: PageProps<'/go/[slug]/[city]'>) {
  const { slug, city: citySlug } = await props.params
  const page = getAdPage(slug)
  const city = getAdCity(citySlug)
  if (!page || !city) notFound()
  return <AdLandingPage page={page} city={city} />
}
