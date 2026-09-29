export type ContentType = 'guide' | 'seo_article' | 'email' | 'telegram' | 'onsite'
export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived'

export interface ContentItem {
  id: string
  type: ContentType
  title: string
  slug?: string
  destination?: string
  angle: string
  excerpt: string
  body: string
  seo?: { metaTitle?: string; metaDescription?: string; keywords?: string[] }
  cta?: { label: string; href: string }
  campaignId?: string
  status: ContentStatus
  createdAt: string
  updatedAt: string
}

export interface ContentOpportunity {
  type: ContentType
  title: string
  reason: string
  destination?: string
  priority: 'high' | 'medium' | 'low'
}
