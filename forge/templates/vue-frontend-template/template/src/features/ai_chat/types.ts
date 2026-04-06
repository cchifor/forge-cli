import type { Message } from '@ag-ui/core'
import { EventType } from '@ag-ui/core'

export interface AgentState {
  todos?: Array<{ content: string; status: string }>
  files?: string[]
  uploads?: Array<{ name: string; path: string; size: number }>
  cost?: {
    total_usd: number
    total_tokens: number
    run_usd: number
    run_tokens: number
  }
  context?: {
    usage_pct: number
    current_tokens: number
    max_tokens: number
  }
  [key: string]: any
}

export type DeepAgentCustomPayload = AgentState

export type WorkspaceAction = { type: string; data: Record<string, any> }

export interface WorkspaceActivity {
  engine: 'ag-ui' | 'mcp-ext'
  activityType: string
  messageId: string
  content: Record<string, any>
}

export type { Message }
export { EventType }
