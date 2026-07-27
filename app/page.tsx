import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ContactForm from '@/components/ContactForm'
import TrustBar from '@/components/TrustBar'
import { MailIcon, MapPinIcon, PhoneIcon } from '@/components/icons'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Sconyers Concrete, Inc. | Commercial Concrete — Greater Atlanta, GA',
  description:
    'Sconyers Concrete Inc. — 30+ years of commercial concrete work in Greater Atlanta. Slabs, paving, sidewalks, ADA ramps & more. Free estimates. Call 706-669-3089.',
  alternates: { canonical: '/' },
}

const services = [
  {
    image: '/images/concrete-slabs.jpg',
    alt: 'Commercial concrete slab work',
    title: 'Concrete Slabs',
    body: 'Industrial-grade slabs for any commercial application. Engineered to handle the loads your business demands.',
  },
  {
    image: '/images/concrete-paving.jpg',
    alt: 'Commercial concrete paving',
    title: 'Concrete Paving',
    body: 'Parking lots, driveways, and commercial surfaces built to endure Atlanta weather and heavy traffic.',
  },
  {
    image: '/images/curbs-gutters.jpg',
    alt: 'Concrete curbs and gutters',
    title: 'Curbs & Gutters',
    body: 'Proper drainage and edge control for parking areas, roads, and commercial properties.',
  },
  {
    image: '/images/sidewalks.jpg',
    alt: 'Commercial concrete sidewalks',
    title: 'Sidewalks',
    body: 'Code-compliant, smooth sidewalks for commercial properties that welcome customers and tenants.',
  },
  {
    image: '/images/ada-ramps.jpg',
    alt: 'ADA handicap concrete ramps',
    title: 'ADA Handicap Ramps',
    body: 'ADA-compliant ramps installed to spec, keeping your property accessible and up to code.',
  },
  {
    image: '/images/stairs.jpg',
    alt: 'Commercial concrete stairs',
    title: 'Stairs',
    body: 'Durable, precisely formed concrete stairs for commercial buildings, entrances, and exterior applications.',
  },
]

const stats = [
  { num: '30', sup: '+', label: 'Years of Combined Experience' },
  { num: '6', label: 'Core Services Offered' },
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
  return (
    <>
      {/* HERO */}
      <section
        className="hero"
        id="home"
        style={{ backgroundImage: "url('/images/hero.jpg')" }}
      >
        <div className="hero-texture" />
        <div className="hero-inner">
          <div className="hero-eyebrow">Greater Atlanta, Georgia · Since 1994</div>
          <h1 className="hero-title">
            <span className="line-1">Built</span>
            <span className="line-2">Solid.</span>
            <span className="line-3">
              Built <em>Right.</em>
            </span>
          </h1>
          <p className="hero-sub">
            30+ years of commercial concrete work across Greater Atlanta. Hospitals.
            Shopping centers. Municipal facilities. Anywhere concrete needs to last.
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
            <span className="section-tag">What We Do</span>
            <h2>Commercial Concrete Services</h2>
            <p>
              From quick place-and-finish jobs to full form, place, and finish — we have
              the tools, crew, and expertise to handle any scale or complexity.
            </p>
          </div>
          <div className="services-grid">
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
                businesses since 1994. We&apos;re not a big-box contractor — we&apos;re a
                hands-on crew that treats every pour like it has our name on it.
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
                src="/images/about-team.jpg"
                alt="Sconyers Concrete crew at a job site"
                width={1408}
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
