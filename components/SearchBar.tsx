'use client'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  resultCount: number
}

export default function SearchBar({ value, onChange, resultCount }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-xl">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg className="h-4 w-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SZUKAJ NARZĘDZI, TAGÓW, OPISÓW…"
        className="gta-input block w-full py-2.5 pl-10 pr-4 font-mono text-sm text-white placeholder-white/20 transition"
        aria-label="Szukaj narzędzi"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/25 hover:text-[#f5c518] transition"
          aria-label="Wyczyść wyszukiwanie"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {value && (
        <p className="absolute -bottom-5 left-1 font-mono text-[10px] text-white/30 uppercase tracking-widest">
          {resultCount === 0 ? 'BRAK WYNIKÓW' : `${resultCount} WYNIKÓW`}
        </p>
      )}
    </div>
  )
}
