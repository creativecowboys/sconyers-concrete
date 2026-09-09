'use client'

import { useFormStatus } from 'react-dom'

/**
 * Submit button that disables itself while the action runs. On a bad signal a
 * form can take several seconds, and a crew member will otherwise tap it four
 * times and file four change orders.
 */
export default function SubmitButton({
  children,
  pendingLabel,
  className = 'adm-btn adm-btn-primary',
}: {
  children: React.ReactNode
  pendingLabel?: string
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? (pendingLabel ?? 'Working…') : children}
    </button>
  )
}
