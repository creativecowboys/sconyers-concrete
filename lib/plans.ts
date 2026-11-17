// Rules for the optional "Attach plans" upload on the estimate forms.
//
// Files go from the browser straight to a PRIVATE Vercel Blob store (a Vercel
// function only takes 4.5 MB of request body, and a plan set is bigger than
// that). /api/plans/upload hands the browser a one-file upload token,
// /api/contact lists the uploaded files in the lead email and the GoHighLevel
// note, and /api/plans/file/... streams a file back to whoever holds the signed
// link from that email.
//
// Pure: no imports, so the same rules run in the browser, on the server and
// under `node --test`.

/** Most files one estimate request can carry. */
export const PLAN_MAX_FILES = 5
/** Largest single file, in bytes (50 MB). */
export const PLAN_MAX_BYTES = 50 * 1024 * 1024
/** Every plan file lives under this folder in the Blob store. */
export const PLAN_PREFIX = 'plans/'

/**
 * File extension -> the one content type the file is uploaded as. The upload
 * token only allows that type, so an extension decides what a file may be.
 * Never add svg or html: the download route serves files from this domain.
 */
export const PLAN_TYPES: Readonly<Record<string, string>> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  zip: 'application/zip',
}

/** What browsers (Windows, older Safari) sometimes report instead of the types above. */
const TYPE_ALIASES: Readonly<Record<string, string>> = {
  'application/x-zip-compressed': 'zip',
  'application/x-zip': 'zip',
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
}

/** For the file input's `accept`. `image/*` lets iPhones offer the photo library. */
export const PLAN_ACCEPT = [
  'application/pdf',
  'image/*',
  'application/zip',
  ...Object.keys(PLAN_TYPES).map((ext) => `.${ext}`),
].join(',')

/** One line under the button, so people know before they pick. */
export const PLAN_HINT = `PDF, photos or ZIP · ${PLAN_MAX_FILES} files, 50 MB each`

/** Lower-case extension of a file name, without the dot ('' when there is none). */
export function fileExtension(name: string): string {
  const match = /\.([A-Za-z0-9]{1,10})$/.exec(name.trim())
  return match ? match[1].toLowerCase() : ''
}

/**
 * The extension a file is stored under: its own when we accept it, else the
 * one that matches the type the browser reported. null = not a plan file.
 */
export function planExtension(name: string, browserType = ''): string | null {
  const ext = fileExtension(name)
  if (ext && PLAN_TYPES[ext]) return ext
  // A known extension we do not accept (dwg, svg, exe) is refused outright,
  // whatever type the browser claims.
  if (ext) return null
  const type = browserType.trim().toLowerCase()
  if (TYPE_ALIASES[type]) return TYPE_ALIASES[type]
  const found = Object.keys(PLAN_TYPES).find((key) => PLAN_TYPES[key] === type)
  return found ?? null
}

/** "2.4 MB", "820 KB", "512 bytes". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${Math.round(bytes)} bytes`
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  const mb = bytes / (1024 * 1024)
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}

export type PlanFileCheck =
  | { ok: true; ext: string; contentType: string }
  | { ok: false; reason: 'type' | 'size' | 'empty'; message: string }

/** Can this file be attached? The browser checks first; the upload token enforces the same. */
export function checkPlanFile(file: { name: string; size: number; type?: string }): PlanFileCheck {
  const name = cleanFileName(file.name) || 'That file'
  const ext = planExtension(file.name, file.type ?? '')
  if (!ext) {
    return {
      ok: false,
      reason: 'type',
      message: `“${name}” can’t be attached. Send a PDF, a photo (JPG, PNG, HEIC) or a ZIP.`,
    }
  }
  if (!(file.size > 0)) {
    return { ok: false, reason: 'empty', message: `“${name}” is empty.` }
  }
  if (file.size > PLAN_MAX_BYTES) {
    return {
      ok: false,
      reason: 'size',
      message: `“${name}” is ${formatBytes(file.size)}. The limit is 50 MB per file.`,
    }
  }
  return { ok: true, ext, contentType: PLAN_TYPES[ext] }
}

/** A file name safe to show in an email or a list: no control characters, sane length. */
export function cleanFileName(name: unknown): string {
  if (typeof name !== 'string') return ''
  const cleaned = name
    .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}…` : cleaned
}

/** YYYY-MM-DD in the browser's own time zone. */
export function localDateStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Where a file goes in the store: plans/<date>/<safe-name>.<ext>. Vercel Blob
 * then adds a random suffix to the name, so two files can never collide and a
 * path cannot be guessed.
 */
export function planPathname(name: string, ext: string, dateStamp: string): string {
  const own = fileExtension(name)
  const base = (own ? name.trim().slice(0, -(own.length + 1)) : name)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/-{2,}/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')
    .slice(0, 60)
    .replace(/[-._]+$/g, '')
  return `${PLAN_PREFIX}${dateStamp}/${base || 'plans'}.${ext}`
}

const PATHNAME_RE = new RegExp(
  `^plans/\\d{4}-\\d{2}-\\d{2}/[A-Za-z0-9][A-Za-z0-9._-]{0,200}\\.(${Object.keys(PLAN_TYPES).join('|')})$`
)

/** True for a path this feature could have written. Both before and after Blob's suffix. */
export function isPlanPathname(pathname: unknown): pathname is string {
  return typeof pathname === 'string' && !pathname.includes('..') && PATHNAME_RE.test(pathname)
}

/** The content type a plan path must be uploaded with, or null when the path is not ours. */
export function planContentTypeForPathname(pathname: unknown): string | null {
  if (!isPlanPathname(pathname)) return null
  return PLAN_TYPES[fileExtension(pathname)] ?? null
}

/**
 * The browser sends `{"files": n}` with each upload: how many files this form
 * is attaching. Advisory only (a bot can lie), but a normal browser that asks
 * for a sixth file is refused.
 */
export function planClientPayloadOk(clientPayload: string | null): boolean {
  if (!clientPayload) return false
  try {
    const data = JSON.parse(clientPayload) as { files?: unknown }
    const files = data?.files
    return typeof files === 'number' && Number.isInteger(files) && files >= 1 && files <= PLAN_MAX_FILES
  } catch {
    return false
  }
}

export type PlanAttachmentRef = { pathname: string; name: string }

/**
 * The `attachments` list from a form submission, cleaned: only plan paths, no
 * duplicates, at most PLAN_MAX_FILES. `dropped` counts what was thrown away.
 */
export function parseAttachments(value: unknown): { items: PlanAttachmentRef[]; dropped: number } {
  if (!Array.isArray(value)) return { items: [], dropped: 0 }
  const items: PlanAttachmentRef[] = []
  const seen = new Set<string>()
  let dropped = 0
  for (const entry of value.slice(0, 20)) {
    const pathname = (entry as { pathname?: unknown })?.pathname
    if (!isPlanPathname(pathname) || seen.has(pathname) || items.length >= PLAN_MAX_FILES) {
      dropped++
      continue
    }
    seen.add(pathname)
    const name = cleanFileName((entry as { name?: unknown }).name) || pathname.split('/').pop()!
    items.push({ pathname, name })
  }
  dropped += Math.max(0, value.length - 20)
  return { items, dropped }
}

/** How many uploads the sender says did not make it (0-PLAN_MAX_FILES). */
export function parseFailedCount(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(n) && n > 0 ? Math.min(n, PLAN_MAX_FILES) : 0
}

/** The site path of a signed download link: /api/plans/file/<sig>/<date>/<file>. */
export function planLinkPath(pathname: string, sig: string): string {
  return `/api/plans/file/${sig}/${pathname.slice(PLAN_PREFIX.length)}`
}

/** Back from the link's path segments to the store path (null when they are not a plan path). */
export function pathnameFromLinkSegments(segments: string[]): string | null {
  const pathname = PLAN_PREFIX + segments.join('/')
  return isPlanPathname(pathname) ? pathname : null
}

/**
 * The file name to offer when the file is saved: the stored name without the
 * random suffix Vercel Blob added.
 */
export function downloadFileName(pathname: string): string {
  const file = pathname.split('/').pop() ?? 'plans'
  return file.replace(/-[A-Za-z0-9]{20,40}(\.[A-Za-z0-9]+)$/, '$1')
}
