'use client'

import { useState } from 'react'

type Variant = 'home' | 'page' | 'landing'
type Status = 'idle' | 'sending' | 'sent' | 'error'

type Props = {
  variant: Variant
  /** Slug or page name recorded on the lead so you know which page produced it. */
  source: string
  submitLabel?: string
  /** Landing pages prefill the "Project City / ZIP" placeholder with the local city. */
  locationPlaceholder?: string
  /** Opt the form element into the scroll-reveal animation. */
  reveal?: boolean
}

const HOME_SERVICES = [
  'Concrete Slabs',
  'Concrete Paving',
  'Curbs & Gutters',
  'Sidewalks',
  'ADA Handicap Ramps',
  'Stairs',
  'Multiple / Not Sure',
]

const PAGE_SERVICES = [
  'Concrete Slabs',
  'Concrete Paving',
  'Curbs & Gutters',
  'Sidewalks',
  'ADA Handicap Ramps',
  'Stairs',
  'Multiple Services',
  'Not Sure — Need Consultation',
]

const LANDING_SERVICES = [
  'Slabs',
  'Paving',
  'Curbs & Gutters',
  'Sidewalks',
  'ADA Ramps',
  'Stairs',
  'Multiple / Other',
]

const PAGE_TIMELINES = [
  'ASAP / Urgent',
  'Within 1 Month',
  '1–3 Months',
  '3–6 Months',
  'Planning Stage',
]

const LANDING_TIMELINES = [
  'ASAP',
  '1–3 Months',
  '3–6 Months',
  '6+ Months',
  'Just Gathering Bids',
]

export default function ContactForm({
  variant,
  source,
  submitLabel,
  locationPlaceholder = 'Douglasville, 30135',
  reveal = false,
}: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setError(null)

    const formData = new FormData(event.currentTarget)
    const payload = Object.fromEntries(formData.entries())

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(
          data?.error ??
            'Something went wrong sending your message. Please call 706-669-3089.'
        )
        setStatus('error')
        return
      }

      setStatus('sent')
    } catch {
      setError(
        'Could not reach the server. Please try again, or call 706-669-3089.'
      )
      setStatus('error')
    }
  }

  const baseClassName = variant === 'page' ? 'contact-page-form' : 'contact-form'
  const sending = status === 'sending'

  if (status === 'sent') {
    // Deliberately no `reveal` class here — ScrollReveal only observes on mount,
    // so a freshly-rendered `.reveal` element would never be made visible.
    return (
      <div className={baseClassName}>
        <h3 style={{ color: 'var(--warm-white)', marginBottom: '0.75rem' }}>
          Thanks — we got it.
        </h3>
        <p style={{ color: 'var(--gray-light)', fontSize: '0.95rem' }}>
          We&apos;ll get back to you with a free estimate, usually within one
          business day. Need it sooner? Call{' '}
          <a href="tel:7066693089" style={{ color: 'var(--accent)' }}>
            706-669-3089
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <form
      className={reveal ? `${baseClassName} reveal` : baseClassName}
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="source" value={source} />
      {/* Honeypot — real people never fill this in. */}
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
      />

      {variant === 'page' ? (
        <PageFields />
      ) : variant === 'landing' ? (
        <LandingFields locationPlaceholder={locationPlaceholder} />
      ) : (
        <HomeFields />
      )}

      <button type="submit" className="btn btn-primary btn-full" disabled={sending}>
        {sending ? 'Sending…' : submitLabel ?? 'Send Message & Request Estimate'}
      </button>

      {variant === 'page' && (
        <p className="form-footnote">
          We&apos;ll respond within 1 business day. Free estimates, no obligation.
        </p>
      )}

      {status === 'error' && error && (
        <p className="form-status error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

function HomeFields() {
  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Your Name</label>
          <input type="text" id="name" name="name" required placeholder="John Smith" />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input type="tel" id="phone" name="phone" placeholder="(706) 000-0000" />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input type="email" id="email" name="email" required placeholder="you@company.com" />
      </div>
      <div className="form-group">
        <label htmlFor="service">Service Needed</label>
        <select id="service" name="service" defaultValue="">
          <option value="">Select a service...</option>
          {HOME_SERVICES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="message">Project Details</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Tell us about your project — size, location, timeline..."
        />
      </div>
    </>
  )
}

function PageFields() {
  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="first-name">First Name *</label>
          <input type="text" id="first-name" name="first-name" required placeholder="John" />
        </div>
        <div className="form-group">
          <label htmlFor="last-name">Last Name *</label>
          <input type="text" id="last-name" name="last-name" required placeholder="Smith" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="cp-phone">Phone Number *</label>
          <input type="tel" id="cp-phone" name="phone" required placeholder="(706) 000-0000" />
        </div>
        <div className="form-group">
          <label htmlFor="cp-email">Email Address *</label>
          <input
            type="email"
            id="cp-email"
            name="email"
            required
            placeholder="you@company.com"
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="company">Company / Organization</label>
        <input type="text" id="company" name="company" placeholder="ABC Construction, LLC" />
      </div>
      <div className="form-group">
        <label htmlFor="cp-service">Service Needed *</label>
        <select id="cp-service" name="service" required defaultValue="">
          <option value="">Select a service...</option>
          {PAGE_SERVICES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="project-address">Project Location / Address</label>
        <input
          type="text"
          id="project-address"
          name="project-address"
          placeholder="123 Main St, Atlanta, GA"
        />
      </div>
      <div className="form-group">
        <label htmlFor="timeline">Estimated Timeline</label>
        <select id="timeline" name="timeline" defaultValue="">
          <option value="">Select a timeline...</option>
          {PAGE_TIMELINES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="cp-message">Project Details *</label>
        <textarea
          id="cp-message"
          name="message"
          rows={5}
          required
          placeholder="Describe your project — size, scope, materials, any special requirements..."
        />
      </div>
    </>
  )
}

function LandingFields({ locationPlaceholder }: { locationPlaceholder: string }) {
  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Your Name</label>
          <input type="text" id="name" name="name" required placeholder="John Smith" />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input type="tel" id="phone" name="phone" required placeholder="(706) 000-0000" />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input type="email" id="email" name="email" required placeholder="you@company.com" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="company">Company / Organization</label>
          <input
            type="text"
            id="company"
            name="company"
            placeholder="ABC Construction, LLC"
          />
        </div>
        <div className="form-group">
          <label htmlFor="location">Project City / ZIP</label>
          <input
            type="text"
            id="location"
            name="location"
            required
            placeholder={locationPlaceholder}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="service">Project Type</label>
          <select id="service" name="service" defaultValue="">
            <option value="">Select a service...</option>
            {LANDING_SERVICES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="timeline">Estimated Start</label>
          <select id="timeline" name="timeline" defaultValue="">
            <option value="">Select a timeline...</option>
            {LANDING_TIMELINES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="message">Project Details</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Describe your project details — size, dimensions, reinforcement specs..."
        />
      </div>
    </>
  )
}
