import Link from 'next/link'
import ToolErrorBoundary from './ToolErrorBoundary'

interface ToolShellProps {
  /** Krótka nazwa narzędzia pokazywana w pasku (breadcrumb) */
  title?: string
  /** Kolor akcentu danego narzędzia (np. GTA orange / baby-blue) */
  accent?: string
  children: React.ReactNode
}

/**
 * Wspólna powłoka KAŻDEGO narzędzia.
 *
 * Daje jedną, powtarzalną warstwę komunikacji:
 *  - stały (sticky) pasek u góry z gwarantowanym powrotem „← Hub",
 *  - breadcrumb z nazwą narzędzia,
 *  - granicę błędu, która nigdy nie zostawia użytkownika bez wyjścia.
 *
 * Motyw samego narzędzia (immersyjne tło GTA/Win95) żyje poniżej paska —
 * pasek jest neutralny, więc nie gryzie się z żadnym stylem.
 */
export default function ToolShell({ title, accent = '#f5c518', children }: ToolShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* ── Wspólny pasek nawigacji ── */}
      <nav className="sticky top-0 z-50 flex h-11 items-center gap-3 border-b border-white/10 bg-black/85 px-4 backdrop-blur-sm">
        <Link
          href="/"
          aria-label="Powrót do Hub"
          className="group inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white/55 transition-colors hover:text-white"
        >
          <span aria-hidden className="transition-transform group-hover:-translate-x-0.5" style={{ color: accent }}>←</span>
          Hub
        </Link>
        {title && (
          <>
            <span aria-hidden className="text-white/15">/</span>
            <span className="truncate font-mono text-[11px] uppercase tracking-widest text-white/40">
              {title}
            </span>
          </>
        )}
      </nav>

      {/* ── Treść narzędzia w granicy błędu ── */}
      <ToolErrorBoundary accent={accent}>
        <div className="min-w-0 flex-1">{children}</div>
      </ToolErrorBoundary>
    </div>
  )
}
