import Link from 'next/link'

/**
 * Globalna strona 404 — spójna z estetyką Hub, zawsze z drogą powrotu.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a0a] p-8 text-center text-white">
      <span className="font-display text-6xl tracking-widest text-[#f5c518]">404</span>
      <div>
        <h1 className="text-lg font-bold uppercase tracking-[0.2em]">Nie znaleziono strony</h1>
        <p className="mt-2 max-w-md font-mono text-xs text-white/40">
          Ten adres nie istnieje albo narzędzie zostało przeniesione.
        </p>
      </div>
      <Link
        href="/"
        className="bg-[#f5c518] px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-black transition hover:bg-[#f5c518]/80"
      >
        ← Wróć do Hub
      </Link>
    </div>
  )
}
