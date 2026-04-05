import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock crypto.randomUUID for deterministic IDs
let uuidCounter = 0
vi.stubGlobal('crypto', {
  randomUUID: () => `uuid-${++uuidCounter}`,
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

import { useAiChat } from './useAiChat'
import { useUiStore } from '@/shared/stores/ui.store'

describe('useAiChat', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
    uuidCounter = 0
  })

  it('starts with empty messages', () => {
    const chat = useAiChat()
    expect(chat.messages.value).toHaveLength(0)
  })

  it('starts with isGenerating false', () => {
    const chat = useAiChat()
    expect(chat.isGenerating.value).toBe(false)
  })

  it('sendMessage adds a user message', () => {
    const chat = useAiChat()
    chat.sendMessage('Hello')

    expect(chat.messages.value).toHaveLength(1)
    expect(chat.messages.value[0].role).toBe('user')
    expect(chat.messages.value[0].content).toBe('Hello')
  })

  it('sendMessage sets isGenerating to true', () => {
    const chat = useAiChat()
    chat.sendMessage('Hello')

    expect(chat.isGenerating.value).toBe(true)
  })

  it('clearMessages empties the messages array', () => {
    const chat = useAiChat()
    chat.sendMessage('First')
    chat.clearMessages()

    expect(chat.messages.value).toHaveLength(0)
  })

  it('toggleChat delegates to uiStore.toggleChat', () => {
    const chat = useAiChat()
    const uiStore = useUiStore()
    const spy = vi.spyOn(uiStore, 'toggleChat')

    chat.toggleChat()
    expect(spy).toHaveBeenCalled()
  })

  it('openChat delegates to uiStore.setChatOpen(true)', () => {
    const chat = useAiChat()
    const uiStore = useUiStore()
    const spy = vi.spyOn(uiStore, 'setChatOpen')

    chat.openChat()
    expect(spy).toHaveBeenCalledWith(true)
  })

  it('closeChat delegates to uiStore.setChatOpen(false)', () => {
    const chat = useAiChat()
    const uiStore = useUiStore()
    const spy = vi.spyOn(uiStore, 'setChatOpen')

    chat.closeChat()
    expect(spy).toHaveBeenCalledWith(false)
  })
})
