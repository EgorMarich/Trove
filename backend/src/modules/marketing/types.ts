export type MarketingEventName =
  | 'search_submitted'
  | 'offer_viewed'
  | 'offer_favorited'
  | 'checkout_started'
  | 'payment_started'
  | 'payment_returned'
  | 'booking_confirmed'
  | 'guide_viewed'
  | 'guide_read'
  | 'campaign_clicked'
  | 'campaign_opened'

export interface MarketingEvent {
  id: string
  name: MarketingEventName
  userId?: string
  sessionId?: string
  payload: Record<string, unknown>
  occurredAt: string
}

export type AudienceRule = { event?: MarketingEventName; minCount?: number; destination?: string; days?: number }
export interface Audience { id: string; name: string; description: string; rules: AudienceRule[]; estimatedSize: number; createdAt: string; updatedAt: string }
export type CampaignStatus = 'draft' | 'approved' | 'scheduled' | 'active' | 'paused' | 'completed'
export type CampaignChannel = 'email' | 'telegram' | 'onsite'
export interface Campaign {
  id: string; name: string; objective: string; audienceId?: string; channels: CampaignChannel[]; status: CampaignStatus
  content: { subject?: string; title: string; body: string; cta?: string }; createdAt: string; updatedAt: string
}
export interface MarketingOverview {
  periodDays: number; visitors: number; searches: number; tourViews: number; bookingStarts: number; bookings: number
  conversionRate: number; attributedRevenue: number; audiences: number; activeCampaigns: number; opportunities: MarketingOpportunity[]
}
export interface MarketingOpportunity { id: string; severity: 'info' | 'warning' | 'success'; title: string; description: string; action: string }
export interface MarketingAnalysis {
  generatedAt: string
  provider: 'rules' | 'llm'
  summary: string
  opportunities: MarketingOpportunity[]
  audiences: Array<{ name: string; description: string; rules: AudienceRule[]; estimatedSize: number }>
  campaigns: Array<{ name: string; objective: string; audienceName?: string; channels: CampaignChannel[]; content: Campaign['content'] }>
  contentIdeas: Array<{ title: string; angle: string; destination?: string }>
}
