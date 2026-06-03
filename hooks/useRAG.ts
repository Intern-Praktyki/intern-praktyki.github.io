'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Tool, Domain } from '@/types'
import { rankTools, filterByCategory } from '@/lib/rag'
import toolsData from '@/data/tools.json'
import domainsData from '@/data/domains.json'

// Dane wbudowane w build (statyczny export — brak backendu na GitHub Pages).
const TOOLS = toolsData as unknown as Tool[]
const DOMAINS = domainsData as unknown as Domain[]

interface UseRAGReturn {
  tools: Tool[]
  domains: Domain[]
  filtered: Tool[]
  query: string
  activeCategory: string
  isLoading: boolean
  error: string | null
  setQuery: (q: string) => void
  setActiveCategory: (cat: string) => void
  reset: () => void
}

export function useRAG(): UseRAGReturn {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('wszystkie')

  const filtered = useMemo(() => {
    const byCategory = filterByCategory(TOOLS, activeCategory)
    return rankTools(byCategory, query)
  }, [query, activeCategory])

  const reset = useCallback(() => {
    setQuery('')
    setActiveCategory('wszystkie')
  }, [])

  return {
    tools: TOOLS,
    domains: DOMAINS,
    filtered,
    query,
    activeCategory,
    isLoading: false,
    error: null,
    setQuery,
    setActiveCategory,
    reset,
  }
}
