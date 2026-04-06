import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/shared/composables/useAuth', () => ({
  useAuth: () => ({
    user: { firstName: 'Alice', lastName: 'Smith', email: 'alice@test.com' },
  }),
}))

import AiChatMessage from './AiChatMessage.vue'

function makeMessage(role: string, content: string, id = 'msg-1') {
  return { id, role, content }
}

describe('AiChatMessage', () => {
  it('user role renders right-aligned', () => {
    const wrapper = mount(AiChatMessage, {
      props: { message: makeMessage('user', 'Hello world') },
    })

    expect(wrapper.find('.flex-row-reverse').exists()).toBe(true)
  })

  it('assistant role renders left-aligned', () => {
    const wrapper = mount(AiChatMessage, {
      props: { message: makeMessage('assistant', 'Hi there') },
    })

    expect(wrapper.find('.ai-gradient').exists()).toBe(true)
    expect(wrapper.find('.flex-row-reverse').exists()).toBe(false)
  })

  it('tool role renders compact card', () => {
    const wrapper = mount(AiChatMessage, {
      props: { message: makeMessage('tool', 'file read result') },
    })

    expect(wrapper.find('.bg-muted\\/50').exists()).toBe(true)
    expect(wrapper.text()).toContain('Tool')
  })

  it('streaming prop shows cursor animation', () => {
    const wrapper = mount(AiChatMessage, {
      props: {
        message: makeMessage('assistant', 'Generating...'),
        isStreaming: true,
      },
    })

    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('message content displayed', () => {
    const wrapper = mount(AiChatMessage, {
      props: { message: makeMessage('user', 'My important question') },
    })

    expect(wrapper.text()).toContain('My important question')
  })

  it('user name from auth shown for user role', () => {
    const wrapper = mount(AiChatMessage, {
      props: { message: makeMessage('user', 'Hello') },
    })

    expect(wrapper.text()).toContain('Alice')
  })

  it('default role renders generic layout', () => {
    const wrapper = mount(AiChatMessage, {
      props: { message: makeMessage('system', 'System info') },
    })

    // No flex-row-reverse (user), no ai-gradient (assistant), no bg-muted (tool)
    expect(wrapper.find('.flex-row-reverse').exists()).toBe(false)
    expect(wrapper.find('.ai-gradient').exists()).toBe(false)
    expect(wrapper.text()).toContain('System info')
  })

  it('empty content handled', () => {
    const wrapper = mount(AiChatMessage, {
      props: { message: makeMessage('assistant', '') },
    })

    // When assistant content is empty, shows "Thinking..."
    expect(wrapper.text()).toContain('Thinking...')
  })
})
