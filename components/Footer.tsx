import Image from 'next/image'
import Link from 'next/link'
import { areaLinks, footerServices, site } from '@/lib/site'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" className="logo logo-light">
            <Image
              src="/images/logo.png"
              alt="Sconyers Concrete logo"
              className="logo-img"
              width={162}
              height={158}
            />
            <span className="logo-text">
              Sconyers
              <br />
              <em>Concrete, Inc.</em>
            </span>
          </Link>
          <p>
            Full-service commercial concrete contractor serving Greater Metro Atlanta, GA.
          </p>
        </div>
        <div className="footer-links">
          <h4>Services</h4>
          <ul>
            {footerServices.map((service) => (
              <li key={service}>
                <Link href="/#services">{service}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-links">
          <h4>Areas We Serve</h4>
          <ul>
            {areaLinks.map((area) => (
              <li key={area.href}>
                <Link href={area.href}>{area.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-contact">
          <h4>Contact</h4>
          <p>
            <a href={site.phoneHref}>{site.phone}</a>
          </p>
          <p>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </p>
          <p>
            {site.street}
            <br />
            {site.city}, {site.region} {site.postalCode}
          </p>
          <p>Serving Greater Atlanta, GA</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {site.name} All rights reserved.</p>
        <a
          className="footer-credit"
          href="https://creativecowboys.co"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Designed by</span>
          <Image
            src="/images/creative-cowboys-white.png"
            alt="Creative Cowboys"
            width={600}
            height={270}
          />
        </a>
      </div>
    </footer>
  )
}
