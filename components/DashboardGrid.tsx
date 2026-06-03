'use client'

import type { Tool, Domain } from '@/types'
import DashboardCard from './DashboardCard'

interface DashboardGridProps {
  tools: Tool[]
  domains: Domain[]
  isLoading: boolean
  error: string | null
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-4 border border-white/[0.07] border-l-2 border-l-white/10 bg-[#111111] p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 bg-white/[0.04]" />
        <div className="h-4 w-14 bg-white/[0.04]" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-1/2 bg-white/[0.06]" />
        <div className="h-3 w-full bg-white/[0.04]" />
        <div className="h-3 w-4/5 bg-white/[0.04]" />
      </div>
      <div className="flex gap-1">
        {[10, 14, 8].map((w, i) => (
          <div key={i} className="h-4 bg-white/[0.04]" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
    </div>
  )
}

export default function DashboardGrid({ tools, domains, isLoading, error }: DashboardGridProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-display text-4xl tracking-widest text-[#f5c518]">BŁĄD</p>
        <p className="mt-2 font-mono text-xs text-white/40">{error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-display text-4xl tracking-widest text-white/20">BRAK WYNIKÓW</p>
        <p className="mt-2 font-mono text-xs text-white/30">ZMIEŃ FRAZĘ LUB ZRESETUJ FILTRY</p>
      </div>
    )
  }

  return (
    <div role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tools.map((tool) => (
        <div key={tool.id} role="listitem">
          <DashboardCard tool={tool} />
        </div>
      ))}
    </div>
  )
}
