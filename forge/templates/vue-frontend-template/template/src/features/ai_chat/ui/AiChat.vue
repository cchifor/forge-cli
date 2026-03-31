<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { X, Send, Sparkles, User } from 'lucide-vue-next'
import { Button } from '@/shared/ui/button'
import { useAiChat } from '../composables/useAiChat'
import { useAuth } from '@/shared/composables/useAuth'

const route = useRoute()
const { user } = useAuth()
const {
  messages,
  isGenerating,
  chatContext,
  closeChat,
  sendMessage,
} = useAiChat()

const inputText = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

watch(
  () => route.meta.title,
  (title) => {
    chatContext.value = (title as string) || 'Current Page'
  },
  { immediate: true },
)

function handleSend() {
  const text = inputText.value.trim()
  if (!text || isGenerating.value) return
  sendMessage(text)
  inputText.value = ''
  nextTick(scrollToBottom)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(messages, () => nextTick(scrollToBottom), { deep: true })
</script>

<template>
  <aside class="flex h-full flex-col bg-background">
    <!-- Header: AI Assistant + Close -->
    <div class="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <div class="flex items-center gap-2">
        <div class="flex h-7 w-7 items-center justify-center rounded-full ai-gradient">
          <Sparkles class="h-3.5 w-3.5 text-white" />
        </div>
        <span class="text-sm font-medium">AI Assistant</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8 interactive-press"
        @click="closeChat"
      >
        <X class="h-4 w-4" />
      </Button>
    </div>

    <!-- Messages -->
    <div
      ref="messagesContainer"
      class="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
    >
      <div
        v-if="messages.length === 0 && !isGenerating"
        class="flex flex-1 flex-col items-center justify-center gap-3 text-center"
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-full ai-gradient">
          <Sparkles class="h-8 w-8 text-white" />
        </div>
        <p class="text-sm text-muted-foreground">
          Ask me anything about this page.
        </p>
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        class="flex gap-3"
        :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
      >
        <!-- Avatar -->
        <div
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          :class="msg.role === 'assistant' ? 'ai-gradient' : 'bg-primary'"
        >
          <Sparkles v-if="msg.role === 'assistant'" class="h-3.5 w-3.5 text-white" />
          <User v-else class="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <!-- Bubble -->
        <div class="flex max-w-[80%] flex-col gap-0.5">
          <span class="text-xs font-medium" :class="msg.role === 'assistant' ? 'text-ai-from' : 'text-primary'">
            {{ msg.role === 'assistant' ? 'AI' : user?.firstName || 'You' }}
          </span>
          <div
            class="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
            :class="
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'ai-gradient text-white'
            "
          >
            {{ msg.content }}
          </div>
        </div>
      </div>

      <!-- Typing indicator -->
      <div v-if="isGenerating" class="flex gap-3">
        <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ai-gradient">
          <Sparkles class="h-3.5 w-3.5 text-white" />
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-xs font-medium text-ai-from">AI</span>
          <div class="ai-gradient ai-pulse rounded-2xl px-4 py-2.5 text-sm text-white">
            Thinking...
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="shrink-0 border-t p-3">
      <div
        class="flex items-end gap-2 rounded-2xl border bg-card p-2 transition-shadow"
        :class="{ 'ai-pulse': isGenerating }"
      >
        <textarea
          v-model="inputText"
          placeholder="Ask anything..."
          rows="1"
          class="flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
          style="max-height: 96px"
          @keydown="handleKeydown"
        />
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 shrink-0 interactive-press"
          :disabled="!inputText.trim() || isGenerating"
          @click="handleSend"
        >
          <Send class="h-4 w-4 text-ai-from" />
        </Button>
      </div>
    </div>
  </aside>
</template>
