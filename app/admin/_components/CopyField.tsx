'use client'

import { useState } from 'react'

export default function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div>
      <span className="adm-field-label">{label}</span>
      <code className="adm-code adm-mb">{value}</code>
      <button type="button" className="adm-btn adm-btn-sm" onClick={copy}>
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}
