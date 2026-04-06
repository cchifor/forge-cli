import { ref, computed, readonly, watch } from 'vue'
import type { WorkspaceActivity } from '../types'
import { useAiChat } from './useAiChat'

const currentActivity = ref<WorkspaceActivity | null>(null)
const activityHistory = ref<WorkspaceActivity[]>([])

export function useWorkspace() {
  const { messages } = useAiChat()

  // Watch for activity messages
  watch(messages, (msgs) => {
    const activities = msgs.filter((m) => (m as any).role === 'activity')
    if (activities.length > 0) {
      const latest = activities[activities.length - 1]
      const activity: WorkspaceActivity = {
        engine: (latest as any).engine || 'ag-ui',
        activityType: (latest as any).activityType || 'fallback',
        messageId: latest.id,
        content: typeof latest.content === 'object' ? latest.content as Record<string, any> : {},
      }
      if (currentActivity.value) {
        activityHistory.value = [...activityHistory.value, currentActivity.value]
      }
      currentActivity.value = activity
    }
  }, { deep: true })

  const hasActivity = computed(() => currentActivity.value !== null)

  function clearActivity() {
    currentActivity.value = null
    activityHistory.value = []
  }

  function goBack() {
    if (activityHistory.value.length > 0) {
      const prev = activityHistory.value[activityHistory.value.length - 1]
      activityHistory.value = activityHistory.value.slice(0, -1)
      currentActivity.value = prev
    } else {
      currentActivity.value = null
    }
  }

  return {
    currentActivity: readonly(currentActivity),
    activityHistory: readonly(activityHistory),
    hasActivity,
    clearActivity,
    goBack,
  }
}
