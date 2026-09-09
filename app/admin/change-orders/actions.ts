'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireOffice } from '@/lib/admin/auth'
import { CHANGE_ORDER_STATUSES, type ChangeOrderStatus } from '@/lib/admin/types'
import { createClient } from '@/lib/supabase/server'

/**
 * Office-side status update. Deliberately three plain states — this is an
 * internal message from the field, not an approval workflow. The official
 * change order to the GC is still issued by the office outside this tool.
 */
export async function setChangeOrderStatus(formData: FormData) {
  await requireOffice()

  const id = formData.get('id')
  const status = formData.get('status')
  if (typeof id !== 'string' || !id) return
  if (typeof status !== 'string' || !(CHANGE_ORDER_STATUSES as readonly string[]).includes(status)) {
    return
  }

  const note = formData.get('office_note')
  const supabase = await createClient()

  const { error } = await supabase
    .from('change_orders')
    .update({
      status: status as ChangeOrderStatus,
      office_note: typeof note === 'string' && note.trim() ? note.trim() : null,
    })
    .eq('id', id)

  if (error) console.error('[admin/change-orders] status update failed:', error.message)

  revalidatePath('/admin/change-orders')
  revalidatePath(`/admin/change-orders/${id}`)
  redirect(`/admin/change-orders/${id}`)
}
