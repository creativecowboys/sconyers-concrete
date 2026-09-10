import type { Metadata } from 'next'
import { requireProfile } from '@/lib/admin/auth'
import { signDocumentUrls } from '@/lib/admin/docs-server'
import type { DocumentRow } from '@/lib/admin/types'
import { createClient } from '@/lib/supabase/server'
import DocRow from '../_components/DocRow'
import SubmitButton from '../_components/SubmitButton'
import DocUploadForm from './DocUploadForm'
import { deleteDocument } from './actions'

export const metadata: Metadata = {
  title: { absolute: 'Docs — Sconyers Staff Admin' },
}

const PAGE_SIZE = 200

export default async function DocsPage() {
  // Everyone signed in sees the whole folder and can add to it. Deleting is
  // the one thing limited to the office, in the UI and in RLS both.
  const profile = await requireProfile()
  const office = profile.role === 'office'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  const docs = (data ?? []) as DocumentRow[]
  const signed = await signDocumentUrls(supabase, docs)

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Docs</h1>
          <p>
            A shared folder for the office and the crews — QR codes, forms,
            anything worth having on a phone. Everyone signed in can see it and
            add to it.
          </p>
        </div>
      </div>

      <h2 className="adm-mb">Upload a document</h2>
      <DocUploadForm profileId={profile.id} />

      <h2 className="adm-mt-lg adm-mb">On file</h2>

      {error ? (
        <div className="adm-note adm-note-bad">
          <strong>Could not load the folder.</strong> {error.message}
        </div>
      ) : docs.length === 0 ? (
        <div className="adm-empty">Nothing here yet. Upload a document.</div>
      ) : (
        <>
          <p className="adm-small adm-muted adm-mb">
            {docs.length === PAGE_SIZE
              ? `Showing the newest ${PAGE_SIZE}.`
              : `${docs.length} document${docs.length === 1 ? '' : 's'}, newest first. Tap one to open it.`}
          </p>

          <div className="adm-stack">
            {docs.map((doc) => (
              <div key={doc.id} className={office ? 'adm-doc adm-doc-office' : 'adm-doc'}>
                <DocRow doc={doc} url={signed[doc.storage_path]} />
                {office ? (
                  <form action={deleteDocument} className="adm-doc-delete">
                    <input type="hidden" name="id" value={doc.id} />
                    <input type="hidden" name="storage_path" value={doc.storage_path} />
                    <SubmitButton
                      className="adm-btn"
                      pendingLabel="Deleting…"
                      confirm={`Delete "${doc.title}"? It cannot be undone.`}
                    >
                      Delete
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
            ))}
          </div>

          {office ? (
            <p className="adm-small adm-muted adm-mt">
              Deleting removes the file for good. Office only.
            </p>
          ) : null}
        </>
      )}
    </>
  )
}
