import { computed, ref } from 'vue'

export interface CommunicationPreference {
  userId: string
  emailMarketing: boolean
  smsMarketing: boolean
  pushMarketing: boolean
  emailTransactional: boolean
  smsTransactional: boolean
  pushTransactional: boolean
  updatedAt: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  channel: 'email' | 'sms' | 'push'
  category: 'transactional' | 'marketing'
  status: 'queued' | 'sent' | 'failed'
  title: string
  body: string
  payload: Record<string, unknown>
  createdAt: string
  sentAt?: string
  readAt?: string
}

export const useCommunications = () => {
  const api = useApi()
  const preferences = useState<CommunicationPreference | null>('trove-communication-preferences', () => null)
  const notifications = useState<Notification[]>('trove-notifications', () => [])
  const loading = ref(false)
  const saving = ref(false)
  const unreadCount = computed(() => notifications.value.filter((item) => !item.readAt).length)

  const load = async () => {
    loading.value = true
    try {
      const [prefs, history] = await Promise.all([
        api<{ item: CommunicationPreference }>('/api/me/communications/preferences'),
        api<{ items: Notification[] }>('/api/me/notifications'),
      ])
      preferences.value = prefs.item
      notifications.value = history.items
    } finally { loading.value = false }
  }

  const updatePreferences = async (patch: Partial<Omit<CommunicationPreference, 'userId' | 'updatedAt'>>) => {
    saving.value = true
    try {
      const response = await api<{ item: CommunicationPreference }>('/api/me/communications/preferences', { method: 'PATCH', body: patch })
      preferences.value = response.item
      return response.item
    } finally { saving.value = false }
  }

  const markRead = async (id: string) => {
    const response = await api<{ item: Notification }>(`/api/me/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' })
    notifications.value = notifications.value.map((item) => item.id === id ? response.item : item)
  }

  const markAllRead = async () => {
    const response = await api<{ items: Notification[] }>('/api/me/notifications/read-all', { method: 'POST' })
    notifications.value = response.items
  }

  return { preferences, notifications, loading, saving, unreadCount, load, updatePreferences, markRead, markAllRead }
}
