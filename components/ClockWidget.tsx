'use client'

import { useState, useEffect } from 'react'

const DAYS_PL = ['NIEDZIELA', 'PONIEDZIAŁEK', 'WTOREK', 'ŚRODA', 'CZWARTEK', 'PIĄTEK', 'SOBOTA']
const MONTHS_PL = [
  'STYCZNIA', 'LUTEGO', 'MARCA', 'KWIETNIA', 'MAJA', 'CZERWCA',
  'LIPCA', 'SIERPNIA', 'WRZEŚNIA', 'PAŹDZIERNIKA', 'LISTOPADA', 'GRUDNIA',
]

export default function ClockWidget() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!now) {
    return (
      <div className="border border-white/[0.07] border-l-2 border-l-[#f5c518]/70 bg-[#111111] p-5 animate-pulse">
        <div className="h-3 w-16 bg-white/[0.06] mb-4" />
        <div className="h-12 w-40 bg-white/[0.06] mb-3" />
        <div className="h-3 w-48 bg-white/[0.04]" />
      </div>
    )
  }

  const hh = now.getHours().toString().padStart(2, '0')
  const mm = now.getMinutes().toString().padStart(2, '0')
  const ss = now.getSeconds().toString().padStart(2, '0')

  return (
    <div className="border border-white/[0.07] border-l-2 border-l-[#f5c518]/70 bg-[#111111] p-5 flex flex-col gap-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
        // SYSTEM CLOCK
      </p>

      <div className="flex items-end gap-1 leading-none">
        <span className="font-display text-6xl tracking-tight text-[#f5c518] tabular-nums">
          {hh}:{mm}
        </span>
        <span className="mb-1 font-mono text-2xl text-white/20 tabular-nums">:{ss}</span>
      </div>

      <div className="border-t border-white/[0.06] pt-2">
        <p className="font-mono text-xs uppercase tracking-wider text-white/40">
          {DAYS_PL[now.getDay()]},&nbsp;{now.getDate()}&nbsp;{MONTHS_PL[now.getMonth()]}&nbsp;{now.getFullYear()}
        </p>
      </div>
    </div>
  )
}
