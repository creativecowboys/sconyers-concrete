import { Fragment } from 'react'
import { trustSectors } from '@/lib/site'

function Segment() {
  return (
    <div className="trust-segment">
      {/* Fragment, not a wrapper element — `.trust-segment span` selectors
          target these spans directly. */}
      {trustSectors.map((sector) => (
        <Fragment key={sector}>
          <span>{sector}</span>
          <span className="dot">·</span>
        </Fragment>
      ))}
    </div>
  )
}

export default function TrustBar() {
  return (
    <>
      <div className="trust-bar-label">Trusted By</div>
      <section className="trust-bar">
        <div className="trust-track">
          {/* Duplicated for a seamless -50% marquee loop */}
          <Segment />
          <Segment />
        </div>
      </section>
    </>
  )
}
