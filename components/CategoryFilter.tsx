'use client'

import type { Domain } from '@/types'

interface CategoryFilterProps {
  domains: Domain[]
  active: string
  onSelect: (id: string) => void
}

export default function CategoryFilter({ domains, active, onSelect }: CategoryFilterProps) {
  const all = { id: 'wszystkie', name: 'Wszystkie', icon: '▣' }
  const items = [all, ...domains.map(d => ({ id: d.id, name: d.name, icon: d.icon }))]

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtruj według kategorii">
      {items.map((item) => {
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            role="tab"
            aria-selected={isActive}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition
              ${isActive
                ? 'bg-[#f5c518] text-black'
                : 'border border-white/10 text-white/40 hover:border-[#f5c518]/40 hover:text-white/70'
              }
            `}
          >
            <span aria-hidden="true" className="text-xs">{item.icon}</span>
            {item.name}
          </button>
        )
      })}
    </div>
  )
}
