'use client'

import { useRAG } from '@/hooks/useRAG'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import CategoryFilter from '@/components/CategoryFilter'
import DashboardGrid from '@/components/DashboardGrid'
import ClockWidget from '@/components/ClockWidget'
import CalendarWidget from '@/components/CalendarWidget'

export default function DashboardPage() {
  const {
    domains,
    filtered,
    query,
    activeCategory,
    isLoading,
    error,
    setQuery,
    setActiveCategory,
    reset,
  } = useRAG()

  return (
    <div className="min-h-screen">
      <Header toolCount={filtered.length} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Top: widgets ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ClockWidget />
          <CalendarWidget />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/20">// NARZĘDZIA</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        {/* ── Bottom: tools ── */}
        <section className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SearchBar value={query} onChange={setQuery} resultCount={filtered.length} />
            {(query || activeCategory !== 'wszystkie') && (
              <button
                onClick={reset}
                className="self-start sm:self-auto font-mono text-[10px] uppercase tracking-widest text-white/25 hover:text-[#f5c518] transition"
              >
                ✕ RESETUJ FILTRY
              </button>
            )}
          </div>

          <CategoryFilter domains={domains} active={activeCategory} onSelect={setActiveCategory} />

          <DashboardGrid tools={filtered} domains={domains} isLoading={isLoading} error={error} />
        </section>

      </main>
    </div>
  )
}
