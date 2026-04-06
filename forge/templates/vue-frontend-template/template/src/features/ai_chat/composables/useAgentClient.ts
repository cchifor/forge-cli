import { shallowRef, ref, readonly } from 'vue'
import { HttpAgent } from '@ag-ui/client'
import type { Message, CustomEvent, RunErrorEvent } from '@ag-ui/core'
import type { AgentState, DeepAgentCustomPayload } from '../types'

const messages = shallowRef<Message[]>([])
const state = shallowRef<AgentState>({})
const customState = shallowRef<DeepAgentCustomPayload>({})
const isRunning = ref(false)
const error = ref<Error | null>(null)
let currentThreadId = crypto.randomUUID()
let agent: HttpAgent | null = null

function getAgent(): HttpAgent {
  if (!agent) {
    agent = new HttpAgent({
      url: import.meta.env.VITE_AGENT_BASE_URL || 'http://localhost:8000',
    })
  }
  return agent
}

export function useAgentClient() {
  async function runAgent() {
    const a = getAgent()

    a.setMessages([...messages.value])
    a.setState({ ...state.value })

    isRunning.value = true
    error.value = null

    try {
      await a.runAgent(
        {
          threadId: currentThreadId,
          runId: crypto.randomUUID(),
          tools: [],
          context: [],
          forwardedProps: {},
        },
        {
          onRunStartedEvent: async () => {
            isRunning.value = true
          },

          onRunFinishedEvent: async () => {
            isRunning.value = false
          },

          onRunErrorEvent: async ({ event }: { event: RunErrorEvent }) => {
            error.value = new Error(event.message || 'Agent run failed')
            isRunning.value = false
          },

          onTextMessageStartEvent: async ({ event }) => {
            messages.value = [
              ...messages.value,
              {
                id: event.messageId,
                role: event.role || 'assistant',
                content: '',
              },
            ]
          },

          onTextMessageContentEvent: async ({ event }) => {
            const msgs = [...messages.value]
            const last = msgs[msgs.length - 1]
            if (last) {
              msgs[msgs.length - 1] = {
                ...last,
                content: (last.content || '') + event.delta,
              }
              messages.value = msgs
            }
          },

          onMessagesSnapshotEvent: async ({ event }) => {
            messages.value = event.messages ?? []
          },

          onStateSnapshotEvent: async ({ event }) => {
            state.value = (event.snapshot ?? {}) as AgentState
          },

          onCustomEvent: async ({ event }: { event: CustomEvent }) => {
            if (event.name === 'deepagent.state_snapshot') {
              customState.value = event.value as DeepAgentCustomPayload
            }
          },
        },
      )
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      isRunning.value = false
    }
  }

  function addUserMessage(content: string) {
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    }
    messages.value = [...messages.value, msg]
  }

  function resetThread() {
    currentThreadId = crypto.randomUUID()
    messages.value = []
    state.value = {}
    customState.value = {}
    error.value = null
  }

  return {
    messages: readonly(messages),
    state: readonly(state),
    customState: readonly(customState),
    isRunning: readonly(isRunning),
    error: readonly(error),
    runAgent,
    addUserMessage,
    resetThread,
  }
}
