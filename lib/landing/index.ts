import { adaRamps } from './ada-ramps'
import { carrollton } from './carrollton'
import { concreteSlabs } from './concrete-slabs'
import { douglasville } from './douglasville'
import { newnan } from './newnan'
import { parkingLotPaving } from './parking-lot-paving'
import type { LandingPage } from './types'
import { villaRica } from './villa-rica'

export const landingPages: LandingPage[] = [
  douglasville,
  newnan,
  carrollton,
  villaRica,
  parkingLotPaving,
  concreteSlabs,
  adaRamps,
]

export function getLandingPage(slug: string): LandingPage | undefined {
  return landingPages.find((page) => page.slug === slug)
}

export type { LandingPage }
