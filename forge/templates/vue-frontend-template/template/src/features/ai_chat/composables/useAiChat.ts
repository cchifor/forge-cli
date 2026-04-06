import { computed, ref, readonly } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/shared/stores/ui.store'
import { useAgentClient } from './useAgentClient'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const chatContext = ref('Current Page')

export function useAiChat() {
  const uiStore = useUiStore()
  const { chatOpen } = storeToRefs(uiStore)
  const agentClient = useAgentClient()

  const messages = computed<ChatMessage[]>(() =>
    agentClient.messages.value
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : '',
        timestamp: new Date(),
      })),
  )

  const isGenerating = computed(() => agentClient.isRunning.value)

  function toggleChat() {
    uiStore.toggleChat()
  }

  function openChat() {
    uiStore.setChatOpen(true)
  }

  function closeChat() {
    uiStore.setChatOpen(false)
  }

  function sendMessage(content: string) {
    agentClient.addUserMessage(content)
    agentClient.runAgent()
  }

  function clearMessages() {
    agentClient.resetThread()
  }

  return {
    chatOpen: readonly(chatOpen),
    messages,
    isGenerating,
    chatContext,
    agentState: agentClient.state,
    customState: agentClient.customState,
    runError: agentClient.error,
    toggleChat,
    openChat,
    closeChat,
    sendMessage,
    clearMessages,
  }
}
