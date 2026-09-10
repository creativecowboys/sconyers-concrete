/**
 * Shared helpers for the Docs folder. Pure functions only — this file is
 * imported by the browser upload form and by server code alike.
 */

/**
 * 25 MB per file. Said in the upload hint, checked in the browser before the
 * upload starts, and set as the `docs` bucket's file_size_limit in
 * supabase/schema.sql so the cap holds even if the browser check is skipped.
 */
export const DOC_MAX_BYTES = 25 * 1024 * 1024

/**
 * What the picker allows. Extensions rather than MIME types on purpose:
 * browsers send an empty type for .csv and a long vendor string for .docx and
 * .xlsx, so the extension is the one thing that is reliably there.
 */
export const DOC_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
  'txt',
] as const

export const DOC_ACCEPT = DOC_EXTENSIONS.map((ext) => `.${ext}`).join(',')

export const DOC_TYPES_HINT = 'PNG, JPG, PDF, Word, Excel, CSV or text — up to 25 MB.'

export function docExtension(name: string) {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim())
  return match ? match[1].toLowerCase() : ''
}

export function isAllowedDoc(name: string) {
  return (DOC_EXTENSIONS as readonly string[]).includes(docExtension(name))
}

/** Short label for the type badge. Extension first (reliable), MIME second. */
export function docKind(originalName: string | null | undefined, mime: string | null | undefined) {
  switch (docExtension(originalName ?? '')) {
    case 'pdf':
      return 'PDF'
    case 'png':
      return 'PNG'
    case 'jpg':
    case 'jpeg':
      return 'JPG'
    case 'doc':
    case 'docx':
      return 'Word'
    case 'xls':
    case 'xlsx':
      return 'Excel'
    case 'csv':
      return 'CSV'
    case 'txt':
      return 'Text'
  }
  if (mime?.startsWith('image/')) return 'Image'
  if (mime === 'application/pdf') return 'PDF'
  return 'File'
}

/** The title field defaults to the filename without its extension. */
export function titleFromFilename(name: string) {
  return name.replace(/\.[a-z0-9]+$/i, '').trim() || name
}

/**
 * Storage keys must be plain ASCII; office filenames often are not
 * ("Review QR – Google.png"). Same rule the photo uploader uses.
 */
export function safeDocName(name: string) {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-60)
  return cleaned || 'document'
}
