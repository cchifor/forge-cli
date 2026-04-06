import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock crypto.randomUUID for deterministic IDs
let uuidCounter = 0
vi.stubGlobal('crypto', {
  randomUUID: () => `uuid-${++uuidCounter}`,
})

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_AGENT_BASE_URL: 'http://test:8000' } } })

// Mock @ag-ui/client
const mockRunAgent = vi.fn()
vi.mock('@ag-ui/client', () => ({
  HttpAgent: vi.fn().mockImplementation(() => ({
    runAgent: mockRunAgent,
    setMessages: vi.fn(),
    setState: vi.fn(),
  })),
}))

import { useAgentClient } from './useAgentClient'

describe('useAgentClient', () => {
  beforeEach(() => {
    uuidCounter = 0
    vi.clearAllMocks()
    mockRunAgent.mockReset()

    // Reset module-level state by calling resetThread
    const { resetThread } = useAgentClient()
    resetThread()
    uuidCounter = 0
  })

  it('addUserMessage adds message with role user, string content, and id', () => {
    const { addUserMessage, messages } = useAgentClient()
    addUserMessage('Hello')

    const msg = messages.value[0]
    expect(msg.role).toBe('user')
    expect(msg.content).toBe('Hello')
    expect(msg.id).toBe('uuid-1')
  })

  it('addUserMessage increments messages.value length', () => {
    const { addUserMessage, messages } = useAgentClient()
    expect(messages.value).toHaveLength(0)

    addUserMessage('First')
    expect(messages.value).toHaveLength(1)

    addUserMessage('Second')
    expect(messages.value).toHaveLength(2)
  })

  it('runAgent calls HttpAgent.runAgent', async () => {
    mockRunAgent.mockResolvedValue(undefined)

    const { runAgent } = useAgentClient()
    await runAgent()

    expect(mockRunAgent).toHaveBeenCalledTimes(1)
  })

  it('runAgent sets isRunning to true', async () => {
    let resolveRun: () => void
    mockRunAgent.mockImplementation(() => new Promise<void>((r) => { resolveRun = r }))

    const { runAgent, isRunning } = useAgentClient()
    const promise = runAgent()

    expect(isRunning.value).toBe(true)

    resolveRun!()
    await promise
  })

  it('onRunFinishedEvent sets isRunning to false', async () => {
    mockRunAgent.mockImplementation(async (_params: any, subscriber: any) => {
      await subscriber.onRunFinishedEvent({ event: {} })
    })

    const { runAgent, isRunning } = useAgentClient()
    await runAgent()

    expect(isRunning.value).toBe(false)
  })

  it('onRunErrorEvent sets error and isRunning to false', async () => {
    mockRunAgent.mockImplementation(async (_params: any, subscriber: any) => {
      await subscriber.onRunErrorEvent({ event: { message: 'Something broke' } })
    })

    const { runAgent, error, isRunning } = useAgentClient()
    await runAgent()

    expect(error.value).toBeInstanceOf(Error)
    expect(error.value!.message).toBe('Something broke')
    expect(isRunning.value).toBe(false)
  })

  it('onTextMessageStartEvent adds new message', async () => {
    mockRunAgent.mockImplementation(async (_params: any, subscriber: any) => {
      await subscriber.onTextMessageStartEvent({
        event: { messageId: 'msg-1', role: 'assistant' },
      })
    })

    const { runAgent, messages } = useAgentClient()
    await runAgent()

    expect(messages.value).toHaveLength(1)
    expect(messages.value[0].id).toBe('msg-1')
    expect(messages.value[0].role).toBe('assistant')
    expect(messages.value[0].content).toBe('')
  })

  it('onTextMessageContentEvent appends to last message content', async () => {
    mockRunAgent.mockImplementation(async (_params: any, subscriber: any) => {
      await subscriber.onTextMessageStartEvent({
        event: { messageId: 'msg-1', role: 'assistant' },
      })
      await subscriber.onTextMessageContentEvent({
        event: { delta: 'Hello ' },
      })
      await subscriber.onTextMessageContentEvent({
        event: { delta: 'world' },
      })
    })

    const { runAgent, messages } = useAgentClient()
    await runAgent()

    expect(messages.value[0].content).toBe('Hello world')
  })

  it('onStateSnapshotEvent updates state', async () => {
    const snapshot = { todos: [{ content: 'Test', status: 'done' }] }
    mockRunAgent.mockImplementation(async (_params: any, subscriber: any) => {
      await subscriber.onStateSnapshotEvent({ event: { snapshot } })
    })

    const { runAgent, state } = useAgentClient()
    await runAgent()

    expect(state.value).toEqual(snapshot)
  })

  it('onCustomEvent with deepagent.state_snapshot updates customState', async () => {
    const payload = { cost: { total_usd: 0.05, total_tokens: 100, run_usd: 0.01, run_tokens: 50 } }
    mockRunAgent.mockImplementation(async (_params: any, subscriber: any) => {
      await subscriber.onCustomEvent({
        event: { name: 'deepagent.state_snapshot', value: payload },
      })
    })

    const { runAgent, customState } = useAgentClient()
    await runAgent()

    expect(customState.value).toEqual(payload)
  })

  it('resetThread clears messages, state, customState, error', async () => {
    mockRunAgent.mockImplementation(async (_params: any, subscriber: any) => {
      await subscriber.onTextMessageStartEvent({
        event: { messageId: 'msg-1', role: 'assistant' },
      })
      await subscriber.onStateSnapshotEvent({ event: { snapshot: { files: ['a.txt'] } } })
      await subscriber.onCustomEvent({
        event: { name: 'deepagent.state_snapshot', value: { cost: {} } },
      })
    })

    const { runAgent, resetThread, messages, state, customState, error } = useAgentClient()
    await runAgent()

    expect(messages.value).toHaveLength(1)

    resetThread()

    expect(messages.value).toEqual([])
    expect(state.value).toEqual({})
    expect(customState.value).toEqual({})
    expect(error.value).toBeNull()
  })

  it('resetThread generates new threadId (messages.value is empty array after reset)', () => {
    const { addUserMessage, resetThread, messages } = useAgentClient()
    addUserMessage('Hello')
    expect(messages.value).toHaveLength(1)

    resetThread()

    expect(messages.value).toHaveLength(0)
    expect(messages.value).toEqual([])
  })

  it('runAgent with thrown error sets error.value', async () => {
    mockRunAgent.mockRejectedValue(new Error('Network failure'))

    const { runAgent, error, isRunning } = useAgentClient()
    await runAgent()

    expect(error.value).toBeInstanceOf(Error)
    expect(error.value!.message).toBe('Network failure')
    expect(isRunning.value).toBe(false)
  })

  it('runAgent with non-Error thrown value wraps it in Error', async () => {
    mockRunAgent.mockRejectedValue('string error')

    const { runAgent, error } = useAgentClient()
    await runAgent()

    expect(error.value).toBeInstanceOf(Error)
    expect(error.value!.message).toBe('string error')
  })

  it('runAgent clears previous error before starting', async () => {
    mockRunAgent.mockRejectedValueOnce(new Error('First failure'))

    const { runAgent, error } = useAgentClient()
    await runAgent()
    expect(error.value).not.toBeNull()

    mockRunAgent.mockResolvedValueOnce(undefined)
    await runAgent()
    expect(error.value).toBeNull()
  })
})
