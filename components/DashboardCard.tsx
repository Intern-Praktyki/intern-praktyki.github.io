'use client'

import Link from 'next/link'
import type { Tool } from '@/types'

interface DashboardCardProps {
  tool: Tool
}

const statusStyles: Record<string, { label: string; classes: string }> = {
  aktywny:  { label: 'AKTYWNY',  classes: 'border-[#f5c518]/60 text-[#f5c518]' },
  wkrotce:  { label: 'WKRÓTCE',  classes: 'border-white/20 text-white/40' },
  archiwum: { label: 'ARCHIWUM', classes: 'border-white/10 text-white/20' },
}

export default function DashboardCard({ tool }: DashboardCardProps) {
  const href = tool.url ?? tool.route ?? '#'
  const isExternal = !!tool.url
  const isDisabled = tool.status === 'archiwum'
  const status = statusStyles[tool.status ?? 'aktywny']

  const inner = (
    <div
      className={`
        group relative flex flex-col gap-4 border border-white/[0.07] bg-[#111111] p-5
        transition-all duration-150
        border-l-2
        ${isDisabled
          ? 'border-l-white/10 opacity-40 cursor-not-allowed'
          : 'border-l-[#f5c518]/70 hover:border-white/20 hover:bg-[#161616] hover:shadow-[0_0_20px_rgba(245,197,24,0.07)] cursor-pointer'
        }
      `}
    >
      {/* Icon + status */}
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center bg-white/[0.04] text-xl">
          {tool.icon}
        </div>
        <span className={`border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest ${status.classes}`}>
          {status.label}
        </span>
      </div>

      {/* Name + description */}
      <div className="flex-1">
        <h3 className="text-sm font-bold uppercase tracking-wide text-white group-hover:text-[#f5c518] transition-colors">
          {tool.name}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-white/40 line-clamp-2">
          {tool.description}
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {tool.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] uppercase text-white/30"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Featured marker */}
      {tool.featured && !isDisabled && (
        <span className="absolute right-0 top-0 h-full w-[2px] bg-[#f5c518]/30" aria-hidden="true" />
      )}
    </div>
  )

  if (isDisabled) return inner

  if (isExternal) {
    return <a href={href} target="_blank" rel="noopener noreferrer" aria-label={tool.name}>{inner}</a>
  }

  return <Link href={href} aria-label={tool.name}>{inner}</Link>
}
