'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * Globalna granica błędu App Routera. Łapie wyjątki z dowolnej strony
 * i zawsze oferuje powrót do Hub — użytkownik nie utyka.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a0a] p-8 text-center text-white">
      <span className="font-display text-6xl tracking-widest text-[#f5c518]">500</span>
      <div>
        <h1 className="text-lg font-bold uppercase tracking-[0.2em]">Coś poszło nie tak</h1>
        <p className="mt-2 max-w-md font-mono text-xs text-white/40 break-words">
          {error.message || 'Nieoczekiwany błąd aplikacji'}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-white/60 transition hover:border-white/40 hover:text-white"
        >
          ↻ Spróbuj ponownie
        </button>
        <Link
          href="/"
          className="bg-[#f5c518] px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-black transition hover:bg-[#f5c518]/80"
        >
          ← Wróć do Hub
        </Link>
      </div>
    </div>
  )
}
