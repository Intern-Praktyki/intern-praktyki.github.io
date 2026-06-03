import type { Tool, RAGResult } from '@/types'

// Score a single tool against a query string.
// Returns 0 if there is no match at all.
export function scoreMatch(tool: Tool, query: string): number {
  if (!query.trim()) return 1

  const q = query.toLowerCase()
  let score = 0

  if (tool.name.toLowerCase().includes(q)) score += 10
  if (tool.description.toLowerCase().includes(q)) score += 5
  if (tool.tags.some((tag) => tag.toLowerCase().includes(q))) score += 3
  if (tool.category.toLowerCase().includes(q)) score += 2

  // Partial word matching — each word in the query scores independently
  const words = q.split(/\s+/).filter(Boolean)
  for (const word of words) {
    if (word.length < 3) continue
    if (tool.name.toLowerCase().includes(word)) score += 4
    if (tool.description.toLowerCase().includes(word)) score += 2
    if (tool.tags.some((tag) => tag.toLowerCase().includes(word))) score += 1
  }

  return score
}

export function rankTools(tools: Tool[], query: string): Tool[] {
  if (!query.trim()) return tools

  const results: RAGResult[] = tools
    .map((tool) => ({ tool, score: scoreMatch(tool, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  return results.map(({ tool }) => tool)
}

export function filterByCategory(tools: Tool[], category: string): Tool[] {
  if (!category || category === 'wszystkie') return tools
  return tools.filter((tool) => tool.category === category)
}

export function getFeatured(tools: Tool[]): Tool[] {
  return tools.filter((tool) => tool.featured && tool.status !== 'archiwum')
}
