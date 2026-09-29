export type CommunicationChannel = 'email' | 'sms' | 'push'
export type CommunicationCategory = 'transactional' | 'marketing'
export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'PRICE_DROP'
  | 'SAVED_SEARCH_MATCH'
  | 'PROMOTION_AVAILABLE'
  | 'REBOOKING_REMINDER'
  | 'PASSWORD_SECURITY_EVENT'

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
  type: NotificationType
  channel: CommunicationChannel
  category: CommunicationCategory
  status: 'queued' | 'sent' | 'failed'
  title: string
  body: string
  payload: Record<string, unknown>
  createdAt: string
  sentAt?: string
  readAt?: string
}

export interface CommunicationEvent {
  userId: string
  type: NotificationType
  category: CommunicationCategory
  title: string
  body: string
  payload?: Record<string, unknown>
  channels?: CommunicationChannel[]
}
