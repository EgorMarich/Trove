import type { MarketingAnalysis, MarketingOverview } from '../types'

export interface MarketingAIProvider { analyze(input: { brief?: string; overview: MarketingOverview; destinations: Array<{ destination: string; views: number }> }): Promise<MarketingAnalysis> }

export class RulesMarketingAIProvider implements MarketingAIProvider {
  async analyze({ overview, destinations }: Parameters<MarketingAIProvider['analyze']>[0]): Promise<MarketingAnalysis> {
    const top = destinations[0]?.destination || 'Турция'
    const abandoned = Math.max(0, overview.bookingStarts - overview.bookings)
    return {
      generatedAt: new Date().toISOString(), provider: 'rules',
      summary: `Нашёл ${overview.opportunities.length} точки роста. Главный сигнал сейчас — ${top}.`,
      opportunities: overview.opportunities,
      audiences: [
        { name: `Высокий intent: ${top}`, description: `Пользователи с повторными просмотрами предложений ${top}.`, rules: [{ event: 'offer_viewed', minCount: 2, destination: top, days: 14 }], estimatedSize: Math.max(0, Math.round(overview.tourViews * 0.08)) },
        { name: 'Win-back checkout', description: 'Пользователи, начавшие бронирование и не завершившие его.', rules: [{ event: 'checkout_started', minCount: 1, days: 2 }], estimatedSize: abandoned },
      ],
      campaigns: [
        { name: `${top}: high intent`, objective: `Увеличить бронирования ${top}`, audienceName: `Высокий intent: ${top}`, channels: ['email','telegram','onsite'], content: { title: `${top}: варианты для следующей поездки`, subject: `Подобрали предложения по ${top}`, body: `Собрали актуальные варианты по ${top}. Сравните цены и выберите подходящий тур.`, cta: 'Смотреть туры' } },
        { name: 'Checkout win-back', objective: 'Вернуть незавершённые бронирования', audienceName: 'Win-back checkout', channels: ['email','onsite'], content: { title: 'Вы почти закончили бронирование', subject: 'Ваше путешествие ещё ждёт вас', body: 'Вернитесь к подборке и проверьте актуальные цены.', cta: 'Продолжить бронирование' } },
      ],
      contentIdeas: destinations.slice(0,3).map(item => ({ title: `${item.destination}: что выбрать в этом сезоне`, angle: 'SEO-гид + коммерческие подборки', destination: item.destination })),
    }
  }
}

export async function createMarketingAIProvider(): Promise<MarketingAIProvider> {
  // Deliberately provider-neutral: a future LLM connector can implement the same contract.
  // TROVE_MARKETING_AI_PROVIDER=rules is the safe default for production without credentials.
  return new RulesMarketingAIProvider()
}
