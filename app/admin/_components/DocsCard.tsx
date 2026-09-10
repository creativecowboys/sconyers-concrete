import Link from 'next/link'
import type { DocumentRow } from '@/lib/admin/types'
import DocRow from './DocRow'

/**
 * The Docs card on the admin home: the newest few documents as tappable rows
 * and a way in to the full folder. Replaced the two stat tiles (Dave, Sep 9
 * 2026 — the photo count was a vanity number and the active-jobs count was
 * already covered by the health panel above).
 *
 * The button is deliberately not primary: "Upload jobsite photos or video"
 * stays the page's one red button.
 */
export default function DocsCard({
  docs,
  total,
  signed,
}: {
  docs: DocumentRow[]
  total: number
  signed: Record<string, string>
}) {
  const more = total > docs.length

  return (
    <section className="adm-docs adm-mt-lg" aria-labelledby="adm-docs-title">
      <div className="adm-docs-head">
        <h2 id="adm-docs-title">Docs</h2>
        {more ? (
          <Link href="/admin/docs">See all {total}</Link>
        ) : (
          <span className="adm-small adm-muted">Shared with everyone signed in</span>
        )}
      </div>

      {docs.length === 0 ? (
        <div className="adm-empty">Nothing here yet. Upload a document.</div>
      ) : (
        <div className="adm-stack">
          {docs.map((doc) => (
            <DocRow key={doc.id} doc={doc} url={signed[doc.storage_path]} />
          ))}
        </div>
      )}

      <Link href="/admin/docs" className="adm-btn adm-btn-block adm-mt">
        Upload a document
      </Link>
    </section>
  )
}
