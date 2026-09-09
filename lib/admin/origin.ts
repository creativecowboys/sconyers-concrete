import { headers } from 'next/headers'
import { site } from '@/lib/site'

/**
 * The origin this request actually arrived on.
 *
 * Hard-coding site.url would send every magic link from a Vercel preview back
 * to production, so the redirect is built from the forwarded host instead.
 */
export async function getOrigin() {
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host')
  if (!host) return site.url
  const proto = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
