'use client'

import { useState } from 'react'

const MONTHS_PL = [
  'STYCZEŃ', 'LUTY', 'MARZEC', 'KWIECIEŃ', 'MAJ', 'CZERWIEC',
  'LIPIEC', 'SIERPIEŃ', 'WRZESIEŃ', 'PAŹDZIERNIK', 'LISTOPAD', 'GRUDZIEŃ',
]
const DAYS_SHORT = ['PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB', 'ND']

function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const offset = (firstDay + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function CalendarWidget() {
  const today = new Date()
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth()
  const cells = buildCalendarGrid(view.year, view.month)

  function prev() {
    setView(v => { const d = new Date(v.year, v.month - 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }
  function next() {
    setView(v => { const d = new Date(v.year, v.month + 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }

  return (
    <div className="border border-white/[0.07] border-l-2 border-l-[#f5c518]/70 bg-[#111111] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
          // KALENDARZ
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            className="flex h-6 w-6 items-center justify-center text-white/25 hover:text-[#f5c518] transition"
            aria-label="Poprzedni miesiąc"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-mono text-[10px] font-bold tracking-widest text-white/60 w-36 text-center">
            {MONTHS_PL[view.month]} {view.year}
          </span>
          <button
            onClick={next}
            className="flex h-6 w-6 items-center justify-center text-white/25 hover:text-[#f5c518] transition"
            aria-label="Następny miesiąc"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1 border-b border-white/[0.06] pb-1">
        {DAYS_SHORT.map(d => (
          <div key={d} className="text-center font-mono text-[9px] text-white/20">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5 mt-1">
        {cells.map((day, i) => {
          const isToday = isCurrentMonth && day === today.getDate()
          return (
            <div
              key={i}
              className={`flex h-7 w-full items-center justify-center font-mono text-xs tabular-nums
                ${!day
                  ? ''
                  : isToday
                  ? 'bg-[#f5c518] font-bold text-black'
                  : 'text-white/35 hover:text-white/70'
                }`}
            >
              {day ?? ''}
            </div>
          )
        })}
      </div>

      {!isCurrentMonth && (
        <button
          onClick={() => setView({ year: today.getFullYear(), month: today.getMonth() })}
          className="mt-3 w-full text-center font-mono text-[10px] uppercase tracking-widest text-white/25 hover:text-[#f5c518] transition"
        >
          ▶ WRÓĆ DO DZIŚ
        </button>
      )}
    </div>
  )
}
