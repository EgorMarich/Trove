import type { NormalizedTour, SearchParams, TravelProvider } from '../../../shared/types/tour'

const offers: NormalizedTour[] = [
  {
    id: 'mediterranean-01', provider: 'Trove Demo Travel', providerOfferId: 'A-1001', title: 'Пляжный отдых в Анталье', hotel: 'Lara Family Resort', city: 'Анталья', destination: 'Турция', countryCode: 'TR', image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85', rating: 4.8, reviews: 1240, duration: 8, departureDate: '12 окт', departure: 'Москва', price: 87400, oldPrice: 103900, currency: 'RUB', meal: 'all-inclusive', room: 'Standard, 2 взрослых', flight: { departureAirport: 'SVO', departureTime: '06:20', arrivalAirport: 'AYT', arrivalTime: '10:35', direct: true }, badge: 'recommended', tags: ['All Inclusive', 'Прямой рейс', 'Пляж рядом'], troveScore: 94, reasons: ['Цена ниже похожих предложений на 16%', 'Рейтинг отеля 4.8 из 5', 'Прямой перелёт'], priceUpdatedAt: new Date().toISOString()
  },
  {
    id: 'red-sea-01', provider: 'SunWay', providerOfferId: 'A-1002', title: 'Море и солнце в Хургаде', hotel: 'Coral Beach Resort', city: 'Хургада', destination: 'Египет', countryCode: 'EG', image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=1200&q=85', rating: 4.6, reviews: 862, duration: 7, departureDate: '18 окт', departure: 'Москва', price: 64900, oldPrice: 82900, currency: 'RUB', meal: 'all-inclusive', room: 'Standard, 2 взрослых', flight: { departureAirport: 'VKO', departureTime: '08:10', arrivalAirport: 'HRG', arrivalTime: '13:00', direct: true }, badge: 'hot', tags: ['All Inclusive', '−22%', 'Пляж'], troveScore: 91, reasons: ['Цена снизилась на 18 000 ₽', 'Хороший рейтинг за эту цену', 'До пляжа 2 минуты'], priceUpdatedAt: new Date().toISOString()
  },
  {
    id: 'ae-01', provider: 'TravelHub', providerOfferId: 'A-1003', title: 'Городской отпуск в Дубае', hotel: 'Rove Downtown', city: 'Дубай', destination: 'ОАЭ', countryCode: 'AE', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=85', rating: 4.7, reviews: 2104, duration: 6, departureDate: '22 окт', departure: 'Москва', price: 119800, currency: 'RUB', meal: 'breakfast', room: 'Rover Room, 2 взрослых', flight: { departureAirport: 'DME', departureTime: '09:40', arrivalAirport: 'DXB', arrivalTime: '16:10', direct: true }, badge: 'new', tags: ['Завтраки', 'Центр', 'Прямой рейс'], troveScore: 89, reasons: ['Отличная локация', 'Высокий рейтинг', 'Удобный прямой рейс'], priceUpdatedAt: new Date().toISOString()
  },
]

export class MockProviderA implements TravelProvider {
  readonly id = 'mock-a'
  readonly name = 'Mock Provider A'
  readonly capabilities = { search: true, priceCheck: true, booking: true, redirect: false } as const
  async search(_params: SearchParams) { return offers.map((offer) => ({ ...offer, priceUpdatedAt: new Date().toISOString(), sourceUrl: `https://demo.trove.local/offers/${offer.providerOfferId}`, bookingUrl: `https://demo.trove.local/book/${offer.id}` })) }
  async checkPrice(id: string) { const offer = await this.getOffer(id); return offer ? { available: true, price: offer.price, currency: offer.currency, checkedAt: new Date().toISOString() } : null }
  async getOffer(id: string) { const offer = offers.find((offer) => offer.id === id); return offer ? { ...offer, priceUpdatedAt: new Date().toISOString(), sourceUrl: `https://demo.trove.local/offers/${offer.providerOfferId}`, bookingUrl: `https://demo.trove.local/book/${offer.id}` } : null }
}
