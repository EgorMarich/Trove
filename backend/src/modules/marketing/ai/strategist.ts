import { aggregateMarketing } from '../repository'
import { getMarketingOverview } from '../service'
import type { MarketingAnalysis } from '../types'
import { createMarketingAIProvider } from './provider'

export async function analyzeMarketing(brief?: string): Promise<MarketingAnalysis> {
  const overview = await getMarketingOverview()
  const aggregate = await aggregateMarketing(overview.periodDays)
  const destinations = aggregate?.destinations || [{ destination: 'Турция', views: overview.tourViews }]
  const provider = await createMarketingAIProvider()
  return provider.analyze({ brief, overview, destinations })
}
