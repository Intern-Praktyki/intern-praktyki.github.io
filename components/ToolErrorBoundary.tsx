'use client'

import React from 'react'
import Link from 'next/link'

interface Props {
  children: React.ReactNode
  accent?: string
}
interface State {
  hasError: boolean
  message?: string
}

/**
 * Granica błędu na poziomie pojedynczego narzędzia.
 * Gdy narzędzie wysypie się w renderze, użytkownik NIGDY nie zostaje
 * uwięziony — dostaje czytelny komunikat + gwarantowany powrót do Hub.
 */
export default class ToolErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : 'Nieznany błąd' }
  }

  componentDidCatch(err: unknown) {
    // Jeden punkt logowania dla wszystkich narzędzi
    console.error('[ToolErrorBoundary]', err)
  }

  reset = () => this.setState({ hasError: false, message: undefined })

  render() {
    if (!this.state.hasError) return this.props.children
    const accent = this.props.accent ?? '#f5c518'

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#0a0a0a] p-8 text-center">
        <div className="text-5xl" aria-hidden>⚠️</div>
        <div>
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-white">
            Narzędzie napotkało błąd
          </h2>
          <p className="mt-2 max-w-md font-mono text-xs text-white/40 break-words">
            {this.state.message}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={this.reset}
            className="border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-white/60 transition hover:border-white/40 hover:text-white"
          >
            ↻ Spróbuj ponownie
          </button>
          <Link
            href="/"
            className="px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-black transition"
            style={{ background: accent }}
          >
            ← Wróć do Hub
          </Link>
        </div>
      </div>
    )
  }
}
