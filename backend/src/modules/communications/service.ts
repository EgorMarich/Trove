import type { User } from '../auth/types'
import { communicationStore } from './store'
import type { CommunicationChannel, CommunicationEvent, NotificationType } from './types'

const preferenceKey = (channel: CommunicationChannel, category: 'transactional' | 'marketing') => `${channel}${category === 'marketing' ? 'Marketing' : 'Transactional'}` as const

function channelAllowed(user: User, event: CommunicationEvent, channel: CommunicationChannel) {
  const prefs = communicationStore.getPreferences(user.id, {
    emailMarketing: user.marketingEmailConsent,
    smsMarketing: user.marketingSmsConsent,
  })
  if (event.category === 'marketing') {
    if (channel === 'email') return prefs.emailMarketing && Boolean(user.email) && Boolean(user.emailVerifiedAt)
    if (channel === 'sms') return prefs.smsMarketing && Boolean(user.phone) && Boolean(user.phoneVerifiedAt)
    return prefs.pushMarketing
  }
  return Boolean(prefs[preferenceKey(channel, 'transactional')]) && (channel !== 'email' || Boolean(user.email)) && (channel !== 'sms' || Boolean(user.phone))
}

const defaultChannels = (type: NotificationType): CommunicationChannel[] => type === 'PRICE_DROP' || type === 'PROMOTION_AVAILABLE' ? ['email', 'push'] : ['email']

export function emitCommunication(user: User, event: CommunicationEvent) {
  const channels = event.channels ?? defaultChannels(event.type)
  const created = []
  for (const channel of channels) {
    if (!channelAllowed(user, event, channel)) continue
    const notification = communicationStore.createNotification({
      userId: user.id,
      type: event.type,
      channel,
      category: event.category,
      status: 'sent',
      title: event.title,
      body: event.body,
      payload: event.payload ?? {},
      sentAt: new Date().toISOString(),
    })
    created.push(notification)
  }
  return created
}

export function communicationPreferenceView(user: User) {
  return communicationStore.getPreferences(user.id, {
    emailMarketing: user.marketingEmailConsent,
    smsMarketing: user.marketingSmsConsent,
  })
}
