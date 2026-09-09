import Link from 'next/link'
import { PinIcon } from './icons'

export default function TopBar() {
  return (
    <div className="top-bar">
      <div className="top-bar-inner">
        <span className="top-bar-left">
          <PinIcon />
          Serving Greater Metro Atlanta
        </span>
        <Link href="/contact" className="top-bar-right">
          Start your next project →
        </Link>
      </div>
    </div>
  )
}
