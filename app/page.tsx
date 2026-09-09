import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ContactForm from '@/components/ContactForm'
import TrustBar from '@/components/TrustBar'
import { MailIcon, MapPinIcon, PhoneIcon } from '@/components/icons'
import { site } from '@/lib/site'
import { generalContractorSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Sconyers Concrete, Inc. | Commercial Concrete — Greater Atlanta, GA',
  description:
    'Sconyers Concrete Inc. — 30+ years of large-scale commercial concrete in Greater Atlanta. Warehouse floors, structural foundations, parking lots & truck courts. Free estimates: 706-669-3089.',
  alternates: { canonical: '/' },
}

const services = [
  {
    image: '/images/concrete-slabs.jpg',
    alt: 'Power-trowelling an interior warehouse floor',
    title: 'Warehouse & Industrial Floors',
    body: "Slab-on-grade floors for distribution, manufacturing, and light industrial buildings — poured to your engineer's reinforcement, joint layout, and flatness spec.",
  },
  {
    image: '/images/foundation-pour.jpg',
    alt: 'Boom pump placing a large formed and reinforced building foundation',
    title: 'Structural Slabs & Foundations',
    body: 'Formed and reinforced footings, grade beams, and structural pours placed by boom pump, sequenced around your steel erector and site trades.',
  },
  {
    image: '/images/concrete-paving.jpg',
    alt: 'Slipform paver placing a commercial concrete lane',
    title: 'Parking Lots & Site Paving',
    body: 'Full-depth concrete parking fields, drive aisles, and access roads for shopping centers, medical campuses, and office parks. Built for decades of traffic.',
  },
  {
    image: '/images/finishing-crew.jpg',
    alt: 'Crew screeding and finishing a large commercial pour',
    title: 'Truck Courts & Loading Docks',
    body: 'Heavy-duty pavement where the loads are worst — dock aprons, trailer parking, refuse pads, and fire lanes. Thicker sections, higher PSI, engineered jointing.',
  },
]

const stats = [
  { num: '30', sup: '+', label: 'Years of Combined Experience' },
  { num: '100', sup: '%', label: 'Self-Performed Crews' },
  { num: '7', label: 'Commercial Sectors Served' },
  { num: 'FREE', label: 'On-Site or Phone Estimates', highlight: true },
]

const pillars = [
  {
    num: '01',
    title: 'Quality First',
    body: 'We bring the materials, the expertise, and the hands-on oversight. No cut corners. No shortcuts. Just concrete that holds up for decades.',
  },
  {
    num: '02',
    title: 'Honest Pricing',
    body: "Every estimate is free and transparent. No hidden fees, no surprise charges. You know what you're getting before work begins.",
  },
  {
    num: '03',
    title: 'Proven Experience',
    body: "30 years in Greater Atlanta means we've seen it all — complex design plans, tricky sites, tight timelines. We handle it.",
  },
]

export default function HomePage() {
  // The landing pages already emit this GeneralContractor block; the homepage
  // (the URL the Google listing links to) had no structured data at all.
  const organizationSchema = generalContractorSchema()
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      {/* HERO */}
      <section
        className="hero"
        id="home"
        style={{ backgroundImage: "url('/images/hero.jpg')" }}
      >
        <div className="hero-texture" />
        <div className="hero-inner">
          <div className="hero-eyebrow">Greater Atlanta, Georgia · 30+ Years</div>
          <h1 className="hero-title">
            <span className="line-1">Built</span>
            <span className="line-2">Solid.</span>
            <span className="line-3">
              Built <em>Right.</em>
            </span>
          </h1>
          <p className="hero-sub">
            30+ years of large-scale commercial concrete across Greater Atlanta.
            Hospitals. Shopping centers. Municipal facilities. The slabs and paving the
            whole build sits on.
          </p>
          <div className="hero-actions">
            <a href={site.phoneHref} className="btn btn-primary">
              <PhoneIcon strokeWidth={2.5} />
              Call {site.phone}
            </a>
            <Link href="/contact" className="btn btn-outline">
              Get a Free Estimate
            </Link>
          </div>
        </div>
        <div className="hero-badge">
          <span className="badge-number">
            30<sup>+</sup>
          </span>
          <span className="badge-label">Years of Experience</span>
        </div>
      </section>

      <TrustBar />

      {/* SERVICES */}
      <section className="services" id="services">
        <div className="section-inner">
          <div className="section-header reveal">
            <span className="section-tag">What We Pour</span>
            <h2>Commercial Concrete at Scale</h2>
            <p>
              Slabs and paving for ground-up commercial construction — self-performed
              from subgrade to final finish. Sidewalks, stairs, and ADA work come with
              the contract.
            </p>
          </div>
          {/* auto-fit: four cards sit in one row on desktop rather than 3 + 1 */}
          <div className="services-grid services-grid--auto">
            {services.map((service, i) => (
              <div
                key={service.title}
                className="service-card reveal"
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className="service-img">
                  <Image src={service.image} alt={service.alt} width={1408} height={768} />
                </div>
                <div className="service-body">
                  <h3>{service.title}</h3>
                  <p>{service.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="services-cta">
            <p>
              All work comes with a <strong>FREE on-site or phone estimate.</strong>
            </p>
            <a href={site.phoneHref} className="btn btn-primary">
              Call for a Free Estimate
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about" id="about">
        <div className="section-inner">
          <div className="about-inner">
            <div className="about-text reveal">
              <span className="section-tag">Who We Are</span>
              <h2>30 Years of Concrete You Can Count On</h2>
              <p className="lead">
                Sconyers Concrete Inc. has been laying the foundation for Greater Atlanta
                businesses since 1994. Strictly commercial, strictly self-performed —
                our own crews run every pour, start to finish.
              </p>
              <p>
                From hospitals and churches to restaurants and shopping centers,
                we&apos;ve built lasting relationships with some of the biggest commercial
                names in the region. We show up on time, do it right the first time, and
                stand behind every job.
              </p>
              <blockquote>
                &quot;We strive to be a company of integrity and honesty — one our
                customers can trust to do the right thing every time.&quot;
                <cite>— Chip Sconyers, Owner</cite>
              </blockquote>
            </div>
            <div className="about-img">
              <Image
                src="/images/slab-crew.jpg"
                alt="Sconyers Concrete crew screeding a commercial slab beside a company truck"
                width={1376}
                height={768}
              />
            </div>
          </div>
          <div className="about-stats reveal">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`stat-card reveal${stat.highlight ? ' highlight' : ''}`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <span className="stat-num">
                  {stat.num}
                  {stat.sup && <sup>{stat.sup}</sup>}
                </span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="why-us">
        <div className="section-inner">
          <div className="section-header reveal">
            <span className="section-tag">Why Sconyers</span>
            <h2>The Contractor That Shows Up</h2>
          </div>
          <div className="pillars">
            {pillars.map((pillar, i) => (
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

      {/* CONTACT */}
      <section className="contact" id="contact">
        <div className="section-inner contact-inner">
          <div className="contact-info reveal">
            <span className="section-tag">Get In Touch</span>
            <h2>Ready to Build Something Solid?</h2>
            <p>
              Call us or send a message — we&apos;ll get back to you fast with a free
              estimate. We serve the entire Greater Atlanta area.
            </p>
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
          <ContactForm variant="home" source="home" reveal />
        </div>
      </section>
    </>
  )
}
