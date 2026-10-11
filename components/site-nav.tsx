'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Swords } from 'lucide-react'

const links = [
  { href: '/', label: 'Lobbys' },
  { href: '/ranking', label: 'Ranking' },
]

export function SiteNav() {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
  return (
    <nav className="topbar">
      <Link href="/" className="brand"><span className="brand-mark"><Swords size={17} /></span><span>DOTA <b>LOBBIES</b></span></Link>
      <div className="nav-links">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={isActive(link.href) ? 'active' : undefined} aria-current={isActive(link.href) ? 'page' : undefined}>{link.label}</Link>
        ))}
      </div>
      <Link href="/admin" className="admin-link"><Shield size={15} /> Admin</Link>
    </nav>
  )
}
