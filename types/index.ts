export interface Tool {
  id: string
  name: string
  description: string
  category: string
  route?: string
  url?: string
  icon: string
  tags: string[]
  featured?: boolean
  status?: 'aktywny' | 'wkrotce' | 'archiwum'
  metadata: Record<string, unknown>
}

export interface Domain {
  id: string
  name: string
  description: string
  icon: string
  color: string
  bgColor: string
}

export interface RAGResult {
  tool: Tool
  score: number
}

export interface LogEntry {
  toolId: string
  timestamp: string
  action: 'open' | 'search'
}
