import type { Metadata } from 'next'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How Sconyers Concrete handles the information you send through this website.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <section className="legal-page">
      <div className="section-inner legal-inner">
        <h1>Privacy</h1>
        <p className="legal-updated">Last updated November 9, 2026</p>

        <h2>What we collect</h2>
        <p>
          When you request an estimate we receive what you type into the form: your name,
          company, phone, email, project location and project details. If you arrived from one
          of our Google ads, the form also records which ad campaign and search brought you.
        </p>

        <h2>What we do with it</h2>
        <p>
          We use it to answer your request and price your project. It is emailed to our office
          and kept in our customer records. We do not sell it or share it with anyone outside
          the people who help us run this website and our records.
        </p>

        <h2>Analytics and advertising</h2>
        <p>
          This site uses Google Analytics and Google Ads to see which pages and ads bring us
          work. They use cookies to do that. When you send the form, your email and phone may be
          passed to Google in a hashed (scrambled) form so Google can tell us that an ad led to
          a request; Google does not get the readable values. You can opt out of personalized
          Google ads at <a href="https://adssettings.google.com">adssettings.google.com</a>.
        </p>

        <h2>Questions</h2>
        <p>
          Call <a href={site.phoneHref}>{site.phone}</a> or email{' '}
          <a href={`mailto:${site.email}`}>{site.email}</a>. {site.name}, {site.street},{' '}
          {site.city}, {site.region} {site.postalCode}.
        </p>
      </div>
    </section>
  )
}
