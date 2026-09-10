import { docKind } from '@/lib/admin/docs'
import { formatBytes, formatDateTime } from '@/lib/admin/format'
import type { DocumentRow } from '@/lib/admin/types'

/**
 * One tappable document. An <a class="adm-row"> that opens the signed URL in a
 * new tab, so the existing `.adm a.adm-row { color: inherit }` keeps it ink
 * rather than link-red. Falls back to a plain box when there is no URL to give.
 */
export default function DocRow({ doc, url }: { doc: DocumentRow; url?: string }) {
  const meta = [
    formatBytes(doc.size_bytes),
    doc.uploaded_by_name ? `by ${doc.uploaded_by_name}` : null,
    formatDateTime(doc.created_at),
  ]
    .filter(Boolean)
    .join(' · ')

  const inner = (
    <>
      <div className="adm-row-title">
        <span>{doc.title}</span>
        <span className="adm-badge">{docKind(doc.original_name, doc.mime_type)}</span>
      </div>
      <div className="adm-row-meta">{meta}</div>
    </>
  )

  if (!url) {
    return <div className="adm-row adm-doc-row">{inner}</div>
  }

  return (
    <a className="adm-row adm-doc-row" href={url} target="_blank" rel="noreferrer">
      {inner}
    </a>
  )
}
