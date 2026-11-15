// Signed download links for plan files.
//
// The Blob store is private, so a file can only be read through
// /api/plans/file/<sig>/<path>. <sig> is an HMAC of the store path with
// PLANS_LINK_SECRET: only /api/contact can make one, and only for files a
// sender attached, so the links in the lead email cannot be forged or guessed.
// Links do not expire; rotating PLANS_LINK_SECRET turns every old link off.
//
// Server only (node:crypto). Kept free of other imports so `node --test` can load it.

import { createHmac, timingSafeEqual } from 'node:crypto'

const SIG_LENGTH = 32

export function signPlanPath(pathname: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`sconyers-plans:v1:${pathname}`)
    .digest('base64url')
    .slice(0, SIG_LENGTH)
}

export function verifyPlanSig(pathname: string, sig: string, secret: string): boolean {
  if (!secret || typeof sig !== 'string' || sig.length !== SIG_LENGTH) return false
  const expected = Buffer.from(signPlanPath(pathname, secret))
  const given = Buffer.from(sig)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
