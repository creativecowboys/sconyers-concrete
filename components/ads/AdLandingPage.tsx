import Image from 'next/image'
import Link from 'next/link'
import ContactForm from '@/components/ContactForm'
import { PhoneIcon } from '@/components/icons'
import type { AdCity, AdPage } from '@/lib/ads/pages'
import { cityPhrase } from '@/lib/ads/pages'
import { site, trustSectors } from '@/lib/site'

/**
 * One Google Ads landing page. Built for a single job: a GC, developer or
 * facility manager who just clicked an ad either calls or sends the form.
 * No site menu, form above the fold on desktop, call button pinned on mobile.
 */
export default function AdLandingPage({ page, city }: { page: AdPage; city?: AdCity }) {
  const headline = page.headline.replace('{city}', cityPhrase(city))
  const source = city ? `go/${page.slug}/${city.slug}` : `go/${page.slug}`

  return (
    <div className="ad-page">
      <header className="ad-header">
        <div className="ad-header-inner">
          <Link href="/" className="ad-logo" aria-label="Sconyers Concrete home">
            <Image src="/images/logo.png" alt="Sconyers Concrete" width={162} height={80} priority />
          </Link>
          <span className="ad-header-tag">Commercial &amp; industrial concrete · Since 1994</span>
          <a href={site.phoneHref} className="btn btn-primary ad-header-call">
            <PhoneIcon strokeWidth={2.5} />
            <span>{site.phone}</span>
          </a>
        </div>
      </header>

      <main>
        <section className="ad-hero">
          <div className="ad-hero-inner">
            <div className="ad-hero-copy">
              <div className="hero-eyebrow">Free estimates · Same-week response</div>
              <h1 className="ad-title">{headline}</h1>
              <p className="ad-sub">{page.sub}</p>
              <ul className="ad-bullets">
                {page.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <a href={site.phoneHref} className="btn btn-primary ad-hero-call">
                <PhoneIcon strokeWidth={2.5} />
                Call {site.phone}
              </a>
              <p className="ad-qualifier">
                Commercial and industrial work only. We don&apos;t pour residential driveways or patios.
              </p>
            </div>
            <div className="ad-hero-form" id="estimate">
              <h2 className="ad-form-title">Get a free estimate</h2>
              <p className="ad-form-sub">Send the basics. We answer within one business day.</p>
              <ContactForm
                variant="ad"
                source={source}
                submitLabel={page.submitLabel}
                locationPlaceholder={city ? `${city.name}, GA` : 'Douglasville, 30135'}
                defaultService={page.service}
              />
            </div>
          </div>
        </section>

        <section className="ad-sectors" aria-label="Who we pour for">
          <span className="ad-sectors-label">We pour for</span>
          <ul>
            {trustSectors.map((sector) => (
              <li key={sector}>{sector}</li>
            ))}
          </ul>
        </section>

        <section className="ad-scope">
          <div className="section-inner">
            <h2>{page.scope.heading}</h2>
            <div className="ad-scope-grid">
              {page.scope.items.map((item) => (
                <div key={item.title} className="ad-scope-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ad-photos" aria-label="Our crews at work">
          <div className="section-inner ad-photo-grid">
            {page.photos.map((photo) => (
              <figure key={photo.src}>
                <Image src={photo.src} alt={photo.alt} width={1408} height={768} sizes="(max-width: 768px) 100vw, 33vw" />
                <figcaption>{photo.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="ad-proof">
          <div className="section-inner ad-proof-inner">
            <div className="ad-proof-stats">
              <div><strong>30+</strong><span>years in Greater Atlanta</span></div>
              <div><strong>100%</strong><span>self-performed crews</span></div>
              <div><strong>Bonded</strong><span>and insured, GL and workers comp</span></div>
              <div><strong>Free</strong><span>on-site or phone estimates</span></div>
            </div>
            <blockquote className="ad-quote">
              &quot;We strive to be a company of integrity and honesty — one our customers can trust
              to do the right thing every time.&quot;
              <cite>— Chip Sconyers, Owner</cite>
            </blockquote>
          </div>
        </section>

        <section className="ad-steps">
          <div className="section-inner">
            <h2>How bidding with us works</h2>
            <ol className="ad-steps-list">
              <li>
                <h3>Send the scope</h3>
                <p>Plans, specs or just the square footage and location. Call or use the form.</p>
              </li>
              <li>
                <h3>We walk it and price it</h3>
                <p>A site visit when it helps, then a firm, itemized number. Free.</p>
              </li>
              <li>
                <h3>Our crews pour it</h3>
                <p>On your schedule, with the same crew from first form to final cut.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="ad-faq">
          <div className="section-inner">
            <h2>Common questions</h2>
            <div className="faq-grid">
              {page.faq.map((item) => (
                <details key={item.q} className="faq-item">
                  <summary>{item.q}</summary>
                  <div className="faq-content">
                    <p>{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="ad-final">
          <div className="section-inner ad-final-inner">
            <h2>Have a job going to bid?</h2>
            <p>Call the office or send the form. Estimates are free.</p>
            <div className="ad-final-actions">
              <a href={site.phoneHref} className="btn btn-primary">
                <PhoneIcon strokeWidth={2.5} />
                Call {site.phone}
              </a>
              <a href="#estimate" className="btn btn-outline">
                Send the form
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="ad-footer">
        <p>
          {site.name} · {site.street}, {site.city}, {site.region} {site.postalCode} ·{' '}
          <a href={site.phoneHref}>{site.phone}</a>
        </p>
        <p>
          <Link href="/">sconyersconcrete.com</Link> · <Link href="/privacy">Privacy</Link>
        </p>
      </footer>

      {/* Mobile: the call button stays on screen the whole way down. */}
      <a href={site.phoneHref} className="ad-sticky-call">
        <PhoneIcon strokeWidth={2.5} />
        Call for a free estimate
      </a>
    </div>
  )
}
