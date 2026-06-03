'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  toolCount?: number
}

const NAV = [
  { href: '/', label: 'Narzędzia' },
]

export default function Header({ toolCount }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-10 border-b border-[#f5c518]/20 bg-black/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">

        <div className="flex items-center gap-8">
          <span className="font-display text-2xl tracking-[0.2em] text-[#f5c518]">HUB</span>

          <nav className="flex items-center" aria-label="Główna nawigacja">
            {NAV.map(({ href, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`
                    relative px-4 py-4 text-xs font-bold uppercase tracking-[0.15em] transition-colors
                    ${active ? 'text-[#f5c518]' : 'text-white/40 hover:text-white/80'}
                  `}
                >
                  {label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#f5c518]" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {toolCount !== undefined && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">
              {toolCount} aktywnych
            </span>
          )}
          <div className="h-2 w-2 bg-[#f5c518]" title="Online" />
        </div>

      </div>
    </header>
  )
}
