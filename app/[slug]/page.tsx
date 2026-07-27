import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import ContactForm from '@/components/ContactForm'
import RichText from '@/components/RichText'
import TrustBar from '@/components/TrustBar'
import { MailIcon, MapPinIcon, PhoneIcon } from '@/components/icons'
import { getLandingPage, landingPages } from '@/lib/landing'
import type { FeatureBand } from '@/lib/landing/types'
import {
  breadcrumbSchema,
  faqSchema,
  generalContractorSchema,
  serviceSchema,
} from '@/lib/schema'
import { site } from '@/lib/site'

const MAP_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3320.5!2d-84.7876!3d33.7365!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x888906!2s2290+Strawn+Rd%2C+Winston%2C+GA+30187!5e0!3m2!1sen!2sus!4v1711000000000'

export const dynamicParams = false

export function generateStaticParams() {
  return landingPages.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata(
  props: PageProps<'/[slug]'>
): Promise<Metadata> {
  const { slug } = await props.params
  const page = getLandingPage(slug)
  if (!page) return {}

  return {
    // Absolute so the layout's "| Sconyers Concrete" template isn't appended
    // to titles that already carry the brand.
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: `/${page.slug}` },
  }
}

export default async function LandingPageRoute(props: PageProps<'/[slug]'>) {
  const { slug } = await props.params
  const page = getLandingPage(slug)
  if (!page) notFound()

  const jsonLd = [
    generalContractorSchema(),
    serviceSchema(page),
    faqSchema(page),
    breadcrumbSchema(page),
  ]

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* HERO */}
      <section
        className="hero"
        id="home"
        style={{ backgroundImage: "url('/images/hero.jpg')" }}
      >
        <div className="hero-texture" />
        <div className="hero-inner">
          <div className="hero-eyebrow">{page.hero.eyebrow}</div>
          <h1 className="hero-title">
            <span className="line-1">{page.hero.lines[0]}</span>
            <span className="line-2">{page.hero.lines[1]}</span>
            <span className="line-3">{page.hero.lines[2]}</span>
          </h1>
          <p className="hero-sub">{page.hero.sub}</p>
          <div className="hero-actions">
            <a href={site.phoneHref} className="btn btn-primary">
              <PhoneIcon strokeWidth={2.5} />
              Call {site.phone}
            </a>
            <a href="#contact" className="btn btn-outline">
              Get a Free Estimate
            </a>
          </div>
          <div className="hero-trust-strip">{page.hero.trustStrip}</div>
        </div>
        <div className="hero-badge">
          <span className="badge-number">
            30<sup>+</sup>
          </span>
          <span className="badge-label">Years of Experience</span>
        </div>
      </section>

      <TrustBar />

      {/* INTRO */}
      <section className="lp-intro">
        <div className="section-inner">
          <span className="section-tag">{page.intro.tag}</span>
          <h2>{page.intro.heading}</h2>
          {page.intro.paragraphs.map((paragraph, i) => (
            <p key={i}>
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="services services--bordered" id="services">
        <div className="section-inner">
          <div className="section-header reveal">
            <span className="section-tag">{page.services.tag}</span>
            <h2>{page.services.heading}</h2>
            <p>{page.services.sub}</p>
          </div>
          <div
            className={`services-grid${page.services.autoColumns ? ' services-grid--auto' : ''}`}
          >
            {page.services.cards.map((card, i) => (
              <div
                key={card.title}
                className="service-card reveal"
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className="service-img">
                  <Image src={card.image} alt={card.alt} width={1408} height={768} />
                </div>
                <div className="service-body">
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {page.featureBand && <FeatureBandSection band={page.featureBand} />}

      {/* LOCAL PROOF */}
      <section className="local-proof">
        <div className="local-proof-inner">
          <span className="section-tag">{page.localProof.tag}</span>
          <h2>{page.localProof.heading}</h2>
          {page.localProof.paragraphs.map((paragraph, i) => (
            <p key={i}>
              <RichText text={paragraph} />
            </p>
          ))}
          {page.localProof.note && (
            <div className="local-proof-note">{page.localProof.note}</div>
          )}
        </div>
      </section>

      {/* WHY US */}
      <section className="why-us">
        <div className="section-inner">
          <div className="section-header reveal">
            <span className="section-tag">{page.whyUs.tag}</span>
            <h2>{page.whyUs.heading}</h2>
          </div>
          <div className="pillars">
            {page.whyUs.pillars.map((pillar, i) => (
              <div
                key={pillar.num}
                className="pillar reveal"
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <span className="pillar-num">{pillar.num}</span>
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS (city pages) */}
      {page.process && (
        <section className="lp-process">
          <div className="section-inner">
            <div className="section-header reveal">
              <span className="section-tag">{page.process.tag}</span>
              <h2>{page.process.heading}</h2>
            </div>
            <div className="lp-process-grid">
              {page.process.steps.map((step) => (
                <div key={step.title} className="lp-process-card">
                  <h4>{step.title}</h4>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="faq-section">
        <div className="section-inner">
          <div className="section-header reveal">
            <span className="section-tag">{page.faq.tag}</span>
            <h2>{page.faq.heading}</h2>
            <p>{page.faq.sub}</p>
          </div>
          <div className="faq-grid">
            {page.faq.items.map((item) => (
              <details key={item.question} className="faq-item">
                <summary>{item.question}</summary>
                <div className="faq-content">
                  {item.answer.map((paragraph, i) => (
                    <p key={i}>
                      <RichText text={paragraph} />
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* MAP */}
      <section className="lp-map">
        <div className="section-inner lp-map-inner">
          <div className="lp-map-frame">
            <iframe
              src={MAP_EMBED_SRC}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Sconyers Concrete location map"
            />
          </div>
          <div className="lp-map-copy">
            <span className="section-tag">{page.map.tag}</span>
            <h3>{page.map.heading}</h3>
            <p>{page.map.body}</p>
            <h4>{page.map.alsoServeHeading}</h4>
            <ul className="lp-serve-list">
              {page.map.alsoServe.map((city) => (
                <li key={city}>{city}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact" id="contact">
        <div className="section-inner contact-inner">
          <div className="contact-info reveal">
            <span className="section-tag">Get In Touch</span>
            <h2>{page.contact.heading}</h2>
            <p>{page.contact.sub}</p>
            <ul className="contact-list">
              <li>
                <PhoneIcon />
                <a href={site.phoneHref}>{site.phone}</a>
              </li>
              <li>
                <MailIcon />
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              <li>
                <MapPinIcon />
                <address>
                  {site.street}, {site.city}, {site.region} {site.postalCode}
                </address>
              </li>
            </ul>
          </div>
          <ContactForm
            variant="landing"
            source={page.slug}
            submitLabel={page.contact.submitLabel}
            locationPlaceholder={page.contact.locationPlaceholder}
            reveal
          />
        </div>
      </section>
    </>
  )
}

function FeatureBandSection({ band }: { band: FeatureBand }) {
  if (band.kind === 'steps') {
    return (
      <section className="lp-band">
        <div className="section-inner lp-band-inner lp-band-inner--left">
          <div className="section-header reveal">
            <span className="section-tag">{band.tag}</span>
            <h2>{band.heading}</h2>
          </div>
          <p className="lp-band-intro lp-band-intro--loose">{band.intro}</p>
          <div className="lp-steps-grid">
            {band.steps.map((step) => (
              <div key={step.title} className="lp-steps-card">
                <h4>{step.title}</h4>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (band.kind === 'compliance') {
    return (
      <section className="lp-band">
        <div className="section-inner lp-band-inner">
          <span className="section-tag">{band.tag}</span>
          <h2>{band.heading}</h2>
          <p className="lp-band-intro">{band.intro}</p>
          <div className="compliance-block">
            <h4>{band.block.heading}</h4>
            <ul>
              {band.block.items.map((item, i) => (
                <li key={i}>
                  <RichText text={item} />
                </li>
              ))}
            </ul>
          </div>
          <p className="lp-band-outro">{band.outro}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="lp-band">
      <div className="section-inner lp-band-inner">
        <span className="section-tag">{band.tag}</span>
        <h2>{band.heading}</h2>
        <p className="lp-band-intro">{band.intro}</p>
        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                {band.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {band.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
