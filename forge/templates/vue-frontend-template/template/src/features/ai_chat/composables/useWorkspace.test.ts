import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'

// Mock crypto.randomUUID
let uuidCounter = 0
vi.stubGlobal('crypto', {
  randomUUID: () => `uuid-${++uuidCounter}`,
})

// Mock useAiChat to return controllable messages ref
const mockMessages = ref<any[]>([])
const mockSendMessage = vi.fn()

vi.mock('./useAiChat', () => ({
  useAiChat: () => ({
    messages: mockMessages,
    sendMessage: mockSendMessage,
  }),
}))

import { useWorkspace } from './useWorkspace'

describe('useWorkspace', () => {
  beforeEach(() => {
    uuidCounter = 0
    mockMessages.value = []
    vi.clearAllMocks()

    // Reset module-level state by getting a handle and clearing
    const { clearActivity } = useWorkspace()
    clearActivity()
  })

  it('initial state: currentActivity is null, hasActivity is false', () => {
    const { currentActivity, hasActivity } = useWorkspace()

    expect(currentActivity.value).toBeNull()
    expect(hasActivity.value).toBe(false)
  })

  it('activity message with engine field sets currentActivity', async () => {
    const { currentActivity } = useWorkspace()

    mockMessages.value = [
      { id: 'msg-1', role: 'activity', engine: 'mcp-ext', activityType: 'credential_form', content: { field: 'value' } },
    ]
    await nextTick()

    expect(currentActivity.value).not.toBeNull()
    expect(currentActivity.value!.engine).toBe('mcp-ext')
    expect(currentActivity.value!.activityType).toBe('credential_form')
  })

  it('activity defaults engine to ag-ui when missing', async () => {
    const { currentActivity } = useWorkspace()

    mockMessages.value = [
      { id: 'msg-1', role: 'activity', activityType: 'file_explorer', content: {} },
    ]
    await nextTick()

    expect(currentActivity.value!.engine).toBe('ag-ui')
  })

  it('activity extracts activityType and content', async () => {
    const { currentActivity } = useWorkspace()

    const contentData = { name: 'test.txt', path: '/tmp/test.txt' }
    mockMessages.value = [
      { id: 'msg-1', role: 'activity', activityType: 'file_explorer', content: contentData },
    ]
    await nextTick()

    expect(currentActivity.value!.activityType).toBe('file_explorer')
    expect(currentActivity.value!.content).toEqual(contentData)
    expect(currentActivity.value!.messageId).toBe('msg-1')
  })

  it('clearActivity resets both current and history', async () => {
    const { currentActivity, activityHistory, clearActivity } = useWorkspace()

    mockMessages.value = [
      { id: 'msg-1', role: 'activity', activityType: 'credential_form', content: {} },
    ]
    await nextTick()

    mockMessages.value = [
      { id: 'msg-1', role: 'activity', activityType: 'credential_form', content: {} },
      { id: 'msg-2', role: 'activity', activityType: 'approval_review', content: {} },
    ]
    await nextTick()

    expect(currentActivity.value).not.toBeNull()
    expect(activityHistory.value.length).toBeGreaterThan(0)

    clearActivity()

    expect(currentActivity.value).toBeNull()
    expect(activityHistory.value).toHaveLength(0)
  })

  it('non-activity role messages are ignored', async () => {
    const { currentActivity, hasActivity } = useWorkspace()

    mockMessages.value = [
      { id: 'msg-1', role: 'user', content: 'Hello' },
      { id: 'msg-2', role: 'assistant', content: 'Hi there' },
    ]
    await nextTick()

    expect(currentActivity.value).toBeNull()
    expect(hasActivity.value).toBe(false)
  })

  it('hasActivity computed updates reactively', async () => {
    const { hasActivity } = useWorkspace()

    expect(hasActivity.value).toBe(false)

    mockMessages.value = [
      { id: 'msg-1', role: 'activity', activityType: 'credential_form', content: {} },
    ]
    await nextTick()

    expect(hasActivity.value).toBe(true)
  })
})
