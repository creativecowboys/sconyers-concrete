import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  contactLinkKind,
  isStaffPath,
  linkLocation,
  phoneDigits,
  phoneLine,
  type LocatableElement,
} from '../lib/analytics-rules.ts'

test('isStaffPath: the admin and everything under it', () => {
  for (const path of ['/admin', '/admin/', '/admin/login', '/admin/auth/callback', '/admin/jobs/123']) {
    assert.equal(isStaffPath(path), true, path)
  }
})

test('isStaffPath: public pages, including ones that merely start with "admin"', () => {
  for (const path of ['/', '/contact', '/commercial-concrete-contractor-newnan-ga', '/administration', '', null, undefined]) {
    assert.equal(isStaffPath(path), false, String(path))
  }
})

test('contactLinkKind: tel and mailto only, any case', () => {
  assert.equal(contactLinkKind('tel:7066693089'), 'tel')
  assert.equal(contactLinkKind(' TEL:+17066693089'), 'tel')
  assert.equal(contactLinkKind('mailto:chip.sconyers@sconyersconcrete.com'), 'mailto')
  assert.equal(contactLinkKind('MailTo:x@y.z'), 'mailto')
  assert.equal(contactLinkKind('/contact'), null)
  assert.equal(contactLinkKind('https://www.google.com/maps'), null)
  assert.equal(contactLinkKind('#contact'), null)
  assert.equal(contactLinkKind(''), null)
  assert.equal(contactLinkKind(null), null)
})

test('phoneLine: the office number however it is written, everything else is "other"', () => {
  const main = 'tel:7066693089'
  assert.equal(phoneDigits('tel:+1 (706) 669-3089'), '7066693089')
  assert.equal(phoneLine('tel:7066693089', main), 'main')
  assert.equal(phoneLine('tel:+17066693089', main), 'main')
  assert.equal(phoneLine('tel:706-669-3089', main), 'main')
  assert.equal(phoneLine('tel:7703449002', main), 'other')
})

/** A stand-in for a DOM link: `containers` maps a selector to the element it would find. */
function fakeLink(containers: Record<string, { id?: string; className?: unknown }>): LocatableElement {
  return { closest: (selector) => containers[selector] ?? null }
}

test('linkLocation: named regions, most specific first', () => {
  assert.equal(linkLocation(fakeLink({ 'nav, header': {} })), 'header')
  assert.equal(linkLocation(fakeLink({ footer: {}, section: { id: 'x' } })), 'footer')
  // The thanks note sits inside the home page's contact section; it wins.
  assert.equal(
    linkLocation(fakeLink({ '.contact-form, .contact-page-form': {}, 'section.contact': {} })),
    'form_thanks'
  )
  // The team cards sit inside the contact page body; they win.
  assert.equal(
    linkLocation(fakeLink({ '.team-contacts': {}, '.contact-page-body': {} })),
    'contact_team'
  )
  assert.equal(linkLocation(fakeLink({ '.contact-page-body': {} })), 'contact_details')
  assert.equal(linkLocation(fakeLink({ '.hero, .contact-page-hero': {} })), 'hero')
  assert.equal(linkLocation(fakeLink({ 'section.contact': {} })), 'contact_section')
  assert.equal(linkLocation(fakeLink({ '.lp-band': {} })), 'cta_band')
})

test('linkLocation: a link nobody planned for falls back to its section', () => {
  assert.equal(linkLocation(fakeLink({ section: { id: 'services', className: 'services' } })), 'services')
  assert.equal(linkLocation(fakeLink({ section: { id: '', className: 'why-us extra' } })), 'why_us')
  assert.equal(linkLocation(fakeLink({ section: { id: '', className: '' } })), 'section')
  assert.equal(linkLocation(fakeLink({})), 'page')
})
