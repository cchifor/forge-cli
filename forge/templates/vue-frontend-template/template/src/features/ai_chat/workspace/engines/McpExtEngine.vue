<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge'
import type { WorkspaceActivity, AgentState } from '../../types'

const props = defineProps<{
  activity: WorkspaceActivity
  state?: AgentState
}>()

const emit = defineEmits<{
  action: [action: { type: string; data: Record<string, any> }]
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
let bridge: AppBridge | null = null

onMounted(async () => {
  const iframe = iframeRef.value
  if (!iframe?.contentWindow) return

  bridge = new AppBridge(
    null,
    { name: 'forge-workspace', version: '1.0.0' },
    { openLinks: {}, logging: {} },
    {
      hostContext: {
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        displayMode: 'inline',
      },
    },
  )

  bridge.oninitialized = () => {
    bridge!.sendToolInput({ arguments: props.activity.content.initialContext || props.activity.content })
  }

  bridge.onmessage = async ({ content }) => {
    const text = content?.find((c: any) => c.type === 'text')?.text
    if (text) emit('action', { type: 'mcp_message', data: { text } })
    return {}
  }

  bridge.onopenlink = async ({ url }) => {
    window.open(url, '_blank', 'noopener,noreferrer')
    return {}
  }

  bridge.onsizechange = ({ height }) => {
    if (height && iframe) iframe.style.height = `${height}px`
  }

  const transport = new PostMessageTransport(iframe.contentWindow, iframe.contentWindow)
  await bridge.connect(transport)

  if (props.activity.content.html) {
    bridge.sendSandboxResourceReady({
      html: props.activity.content.html,
      csp: props.activity.content.csp,
      permissions: props.activity.content.permissions,
    })
  }
})

onUnmounted(async () => {
  if (bridge) {
    await bridge.teardownResource({}).catch(() => {})
    bridge = null
  }
})
</script>

<template>
  <iframe
    ref="iframeRef"
    :src="activity.content.entryUrl"
    sandbox="allow-scripts allow-same-origin allow-forms"
    class="w-full h-full border-0"
    title="MCP Extension"
  />
</template>
