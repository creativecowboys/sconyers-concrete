import { Fragment } from 'react'

const STRONG = /<strong>(.*?)<\/strong>/g

/**
 * Renders the small subset of inline markup the landing-page copy uses:
 * `<strong>…</strong>` and nothing else. Everything outside those tags is
 * emitted as plain text, so the content files can never inject markup.
 */
export default function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  STRONG.lastIndex = 0
  while ((match = STRONG.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>)
    }
    parts.push(<strong key={key++}>{match[1]}</strong>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>)
  }

  return <>{parts}</>
}
