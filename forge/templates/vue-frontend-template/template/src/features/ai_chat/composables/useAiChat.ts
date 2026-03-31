import { ref, readonly } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/shared/stores/ui.store'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const messages = ref<ChatMessage[]>([])
const isGenerating = ref(false)
const chatContext = ref('Current Page')

export function useAiChat() {
  const uiStore = useUiStore()
  const { chatOpen } = storeToRefs(uiStore)

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
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    messages.value.push(userMsg)

    isGenerating.value = true
    setTimeout(() => {
      messages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'This is a placeholder response. AI integration coming soon.',
        timestamp: new Date(),
      })
      isGenerating.value = false
    }, 1500)
  }

  function clearMessages() {
    messages.value = []
  }

  return {
    chatOpen: readonly(chatOpen),
    messages: readonly(messages),
    isGenerating: readonly(isGenerating),
    chatContext,
    toggleChat,
    openChat,
    closeChat,
    sendMessage,
    clearMessages,
  }
}
