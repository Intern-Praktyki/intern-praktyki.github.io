'use client'

import Link from 'next/link'
import type { Tool } from '@/types'

interface DashboardCardProps {
  tool: Tool
}

// Krótkie etykiety kategorii (GTA IV: monochrom + jedna etykieta)
const CAT_LABEL: Record<string, string> = {
  osint: 'OSINT',
  'web-tools': 'WEB',
  narzedzia: 'OWN',
}

export default function DashboardCard({ tool }: DashboardCardProps) {
  const href = tool.url ?? tool.route ?? '#'
  const isExternal = !!tool.url
  const cat = CAT_LABEL[tool.category] ?? tool.category.toUpperCase()

  const inner = (
    <div
      className="group relative flex h-full flex-col gap-4 overflow-hidden p-5 transition-all duration-150 hover:-translate-y-[1px]"
      style={{
        background: 'linear-gradient(180deg,#23272e 0%,#14171b 60%,#0f1215 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(0,0,0,0.4), 0 6px 18px rgba(0,0,0,0.45)',
      }}
    >
      {/* Lewy pasek selekcji (GTA IV menu highlight) */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[#f5c518]/30 transition-all duration-150 group-hover:bg-[#f5c518] group-hover:shadow-[0_0_12px_rgba(245,197,24,0.6)]"
      />
      {/* Górny połysk panelu */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />

      {/* Ikona + kategoria */}
      <div className="flex items-center justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center text-xl"
          style={{
            background: 'linear-gradient(180deg,#0c0e11,#1a1e23)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(0,0,0,0.5)',
          }}
        >
          {tool.icon}
        </div>
        <span className="font-mono text-[9px] font-bold tracking-[0.25em] text-white/25 transition-colors group-hover:text-[#f5c518]/70">
          {cat}
        </span>
      </div>

      {/* Nazwa + opis */}
      <div className="flex-1">
        <h3 className="font-display text-xl leading-none tracking-wide text-white/90 transition-colors group-hover:text-[#f5c518]">
          {tool.name}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-white/35 line-clamp-2">
          {tool.description}
        </p>
      </div>

      {/* Tagi */}
      <div className="flex flex-wrap gap-1">
        {tool.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="bg-black/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/30"
            style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)' }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Marker wyróżnienia + strzałka linku zewnętrznego */}
      {tool.featured && (
        <span
          aria-hidden
          className="absolute right-0 top-0 h-0 w-0"
          style={{ borderTop: '14px solid rgba(245,197,24,0.55)', borderLeft: '14px solid transparent' }}
        />
      )}
      <span className="pointer-events-none absolute bottom-3 right-3 font-mono text-[10px] text-white/0 transition-colors group-hover:text-white/40">
        {isExternal ? '↗' : '→'}
      </span>
    </div>
  )

  if (isExternal) {
    return <a href={href} target="_blank" rel="noopener noreferrer" aria-label={tool.name} className="block h-full">{inner}</a>
  }

  return <Link href={href} aria-label={tool.name} className="block h-full">{inner}</Link>
}
