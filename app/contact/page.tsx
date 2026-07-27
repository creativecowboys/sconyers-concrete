import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from '@/components/icons'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  // Absolute — the title already carries the brand, so don't let the root
  // layout's "%s | Sconyers Concrete" template append it a second time.
  title: { absolute: 'Contact Us | Sconyers Concrete, Inc. — Free Estimates' },
  description:
    'Contact Sconyers Concrete Inc. for a free estimate. Serving Greater Atlanta, GA. Call 706-669-3089 or send us a message.',
  alternates: { canonical: '/contact' },
}

const MAP_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3320.5!2d-84.7876!3d33.7365!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x888906!2s2290+Strawn+Rd%2C+Winston%2C+GA+30187!5e0!3m2!1sen!2sus!4v1711000000000'

const team = [
  {
    name: 'Brice Wiley',
    title: 'Senior Management / Sales',
    phone: '706-669-3089',
    phoneHref: 'tel:7066693089',
    email: 'brice.wiley@sconyersconcrete.com',
  },
  {
    name: 'Heather Gray',
    title: 'Controller',
    phone: '770-344-9002',
    phoneHref: 'tel:7703449002',
    email: 'heather.gray@sconyersconcrete.com',
  },
]

const hours = [
  ['Mon – Fri', '7:00 AM – 5:00 PM'],
  ['Saturday', 'By Appointment'],
  ['Sunday', 'Closed'],
]

export default function ContactPage() {
  return (
    <>
      <section className="contact-page-hero">
        <span className="section-tag">Free Estimates Available</span>
        <h1>
          Let&apos;s Build
          <br />
          <em>Something Solid</em>
        </h1>
        <p>
          Reach out for a free estimate. We serve the entire Greater Atlanta area and
          respond fast.
        </p>
      </section>

      <section className="contact-page-body">
        <div className="contact-page-inner">
          {/* LEFT: info + map */}
          <div className="contact-page-info">
            <h2>Get In Touch</h2>
            <div className="contact-info-cards">
              <div className="contact-info-card">
                <div className="contact-info-card-icon">
                  <PhoneIcon strokeWidth={2.5} />
                </div>
                <div className="contact-info-card-body">
                  <h4>Phone</h4>
                  <a href={site.phoneHref}>{site.phone}</a>
                </div>
              </div>
              <div className="contact-info-card">
                <div className="contact-info-card-icon">
                  <MailIcon strokeWidth={2.5} />
                </div>
                <div className="contact-info-card-body">
                  <h4>Email</h4>
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                </div>
              </div>
              <div className="contact-info-card">
                <div className="contact-info-card-icon">
                  <MapPinIcon strokeWidth={2.5} />
                </div>
                <div className="contact-info-card-body">
                  <h4>Address</h4>
                  <p>
                    {site.street}
                    <br />
                    {site.city}, {site.region} {site.postalCode}
                  </p>
                </div>
              </div>
              <div className="contact-info-card">
                <div className="contact-info-card-icon">
                  <ClockIcon />
                </div>
                <div className="contact-info-card-body">
                  <h4>Business Hours</h4>
                  <table className="hours-table">
                    <tbody>
                      {hours.map(([day, time]) => (
                        <tr key={day}>
                          <td>{day}</td>
                          <td>{time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="team-contacts">
              <h3>Contact Our Team</h3>
              {team.map((member) => (
                <div key={member.name} className="team-card">
                  <div className="team-card-info">
                    <span className="team-name">{member.name}</span>
                    <span className="team-title">{member.title}</span>
                  </div>
                  <div className="team-card-links">
                    <a href={member.phoneHref}>
                      <PhoneIcon size={15} strokeWidth={2.5} />
                      {member.phone}
                    </a>
                    <a href={`mailto:${member.email}`}>
                      <MailIcon size={15} strokeWidth={2.5} />
                      {member.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="map-container">
              <iframe
                src={MAP_EMBED_SRC}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Sconyers Concrete location map"
              />
            </div>
          </div>

          {/* RIGHT: form */}
          <div className="contact-page-form-wrap">
            <h2>Request a Free Estimate</h2>
            <p>Fill out the form and we&apos;ll get back to you within one business day.</p>
            <ContactForm
              variant="page"
              source="contact"
              submitLabel="Submit Estimate Request"
            />
          </div>
        </div>
      </section>
    </>
  )
}
