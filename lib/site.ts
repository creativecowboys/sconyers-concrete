export const site = {
  name: 'Sconyers Concrete, Inc.',
  url: 'https://www.sconyersconcrete.com',
  phone: '706-669-3089',
  phoneHref: 'tel:7066693089',
  phoneE164: '+1-706-669-3089',
  email: 'chip.sconyers@sconyersconcrete.com',
  street: '2290 Strawn Rd',
  city: 'Winston',
  region: 'GA',
  postalCode: '30187',
  foundingDate: '1994',
  geo: { latitude: 33.6779, longitude: -84.8588 },
} as const

export const trustSectors = [
  'Hospitals',
  'Shopping Centers',
  'Churches',
  'Office Parks',
  'Country Clubs',
  'Restaurants',
  'Municipal Facilities',
] as const

/** Footer "Areas We Serve" column — also the canonical list of landing-page routes. */
export const areaLinks = [
  { href: '/commercial-concrete-contractor-douglasville-ga', label: 'Douglasville, GA' },
  { href: '/commercial-concrete-contractor-newnan-ga', label: 'Newnan, GA' },
  { href: '/commercial-concrete-contractor-carrollton-ga', label: 'Carrollton, GA' },
  { href: '/commercial-concrete-contractor-villa-rica-ga', label: 'Villa Rica, GA' },
  { href: '/commercial-parking-lot-paving-douglasville-ga', label: 'Parking Lot Paving' },
  { href: '/commercial-concrete-slabs-newnan-ga', label: 'Concrete Slabs' },
  { href: '/ada-ramp-installation-west-georgia', label: 'ADA Ramp Installation' },
] as const

/**
 * Advertised services. Sconyers is strictly large commercial, so the site
 * headlines the two heavy disciplines — slabs and paving — split into the
 * scopes a GC or developer actually bids. Sidewalks, stairs and ADA work are
 * still self-performed, but as part of these contracts rather than as
 * standalone jobs, so they are not sold separately.
 */
export const footerServices = [
  'Warehouse & Industrial Floors',
  'Structural Slabs & Foundations',
  'Parking Lots & Site Paving',
  'Truck Courts & Loading Docks',
] as const
