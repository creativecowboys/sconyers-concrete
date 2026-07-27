import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Lora } from 'next/font/google'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import ScrollReveal from '@/components/ScrollReveal'
import TopBar from '@/components/TopBar'
import { site } from '@/lib/site'
import './globals.css'

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Sconyers Concrete, Inc. | Commercial Concrete — Greater Atlanta, GA',
    template: '%s | Sconyers Concrete',
  },
  description:
    'Sconyers Concrete Inc. — 30+ years of large-scale commercial concrete in Greater Atlanta. Warehouse floors, structural foundations, parking lots & truck courts. Free estimates: 706-669-3089.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${barlowCondensed.variable} ${lora.variable}`}
    >
      <head>
        {/* `.reveal` starts at opacity 0 and is revealed by ScrollReveal.
            Without JS nothing would ever reveal it, so neutralise it. */}
        <noscript>
          <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
      </head>
      <body>
        <TopBar />
        <Nav />
        {children}
        <Footer />
        <ScrollReveal />
      </body>
    </html>
  )
}
