<script setup lang="ts">
import { Sparkles, User, Wrench } from 'lucide-vue-next'
import { useAuth } from '@/shared/composables/useAuth'

const props = defineProps<{
  message: { id: string; role: string; content: string }
  isStreaming?: boolean
}>()

const { user } = useAuth()
</script>

<template>
  <!-- User message -->
  <div v-if="props.message.role === 'user'" class="flex gap-3 flex-row-reverse">
    <div
      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary"
    >
      <User class="h-3.5 w-3.5 text-primary-foreground" />
    </div>
    <div class="flex max-w-[80%] flex-col gap-0.5">
      <span class="text-xs font-medium text-primary text-right">
        {{ user?.firstName || 'You' }}
      </span>
      <div class="rounded-2xl bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
        {{ props.message.content }}
      </div>
    </div>
  </div>

  <!-- Assistant message -->
  <div v-else-if="props.message.role === 'assistant'" class="flex gap-3">
    <div
      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ai-gradient"
    >
      <Sparkles class="h-3.5 w-3.5 text-white" />
    </div>
    <div class="flex max-w-[80%] flex-col gap-0.5">
      <span class="text-xs font-medium text-ai-from">AI</span>
      <div
        class="rounded-2xl ai-gradient px-4 py-2.5 text-sm leading-relaxed text-white"
        :class="{ 'ai-pulse': props.isStreaming && !props.message.content }"
      >
        <template v-if="props.message.content">
          {{ props.message.content }}<span
            v-if="props.isStreaming"
            class="inline-block w-1.5 h-4 ml-0.5 bg-white/70 animate-pulse align-text-bottom"
          />
        </template>
        <template v-else>
          Thinking...
        </template>
      </div>
    </div>
  </div>

  <!-- Tool message -->
  <div v-else-if="props.message.role === 'tool'" class="flex gap-3">
    <div
      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted"
    >
      <Wrench class="h-3.5 w-3.5 text-muted-foreground" />
    </div>
    <div class="flex max-w-[80%] flex-col gap-0.5">
      <span class="text-xs font-medium text-muted-foreground">Tool</span>
      <div class="rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        {{ props.message.content }}
      </div>
    </div>
  </div>

  <!-- Default / unknown role -->
  <div v-else class="flex gap-3">
    <div class="flex max-w-[80%] flex-col gap-0.5 pl-10">
      <div class="text-sm text-muted-foreground">
        {{ props.message.content }}
      </div>
    </div>
  </div>
</template>
