import { randomToken } from '../security/crypto'
import type { CommunicationChannel, CommunicationPreference, Notification } from './types'

const preferences = new Map<string, CommunicationPreference>()
const notifications = new Map<string, Notification[]>()

export const communicationStore = {
  getPreferences(userId: string, marketingDefaults?: Partial<Pick<CommunicationPreference, 'emailMarketing' | 'smsMarketing'>>): CommunicationPreference {
    const existing = preferences.get(userId)
    if (existing) return existing
    const now = new Date().toISOString()
    const value: CommunicationPreference = {
      userId,
      emailMarketing: marketingDefaults?.emailMarketing ?? false,
      smsMarketing: marketingDefaults?.smsMarketing ?? false,
      pushMarketing: false,
      emailTransactional: true,
      smsTransactional: true,
      pushTransactional: true,
      updatedAt: now,
    }
    preferences.set(userId, value)
    return value
  },
  updatePreferences(userId: string, patch: Partial<Omit<CommunicationPreference, 'userId' | 'updatedAt'>>) {
    const current = this.getPreferences(userId)
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
    preferences.set(userId, next)
    return next
  },
  addNotification(notification: Notification) {
    const list = notifications.get(notification.userId) ?? []
    notifications.set(notification.userId, [notification, ...list].slice(0, 200))
    return notification
  },
  listNotifications(userId: string) { return notifications.get(userId) ?? [] },
  markRead(userId: string, id: string) {
    const item = (notifications.get(userId) ?? []).find((notification) => notification.id === id)
    if (!item) return undefined
    item.readAt = item.readAt ?? new Date().toISOString()
    return item
  },
  markAllRead(userId: string) {
    const now = new Date().toISOString()
    const list = notifications.get(userId) ?? []
    list.forEach((item) => { item.readAt = item.readAt ?? now })
    return list
  },
  createNotification(input: Omit<Notification, 'id' | 'createdAt'>) {
    return this.addNotification({ ...input, id: `ntf_${randomToken(10)}`, createdAt: new Date().toISOString() })
  },
}
