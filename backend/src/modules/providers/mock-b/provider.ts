import type { NormalizedTour, SearchParams, TravelProvider } from '../../../shared/types/tour'

const offers: NormalizedTour[] = [
  {
    id: 'thai-01', provider: 'SunWay', providerOfferId: 'B-2001', title: 'Тропический Пхукет', hotel: 'Katathani Phuket Beach Resort', city: 'Пхукет', destination: 'Таиланд', countryCode: 'TH', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85', rating: 4.9, reviews: 1745, duration: 10, departureDate: '3 ноя', departure: 'Москва', price: 138500, currency: 'RUB', meal: 'breakfast', room: 'Deluxe, 2 взрослых', flight: { departureAirport: 'SVO', departureTime: '21:00', arrivalAirport: 'HKT', arrivalTime: '10:40', direct: false }, tags: ['Пляж', 'Завтраки', '★★★★★'], troveScore: 88, reasons: ['Почти идеальный рейтинг', 'Большой выбор ресторанов рядом', '10 ночей'], priceUpdatedAt: new Date().toISOString()
  },
  {
    id: 'tr-istanbul-01', provider: 'CityBreak', providerOfferId: 'B-2002', title: 'Стамбул: город, который не спит', hotel: 'The Wings Hotel', city: 'Стамбул', destination: 'Турция', countryCode: 'TR', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=85', rating: 4.7, reviews: 936, duration: 5, departureDate: '10 окт', departure: 'Москва', price: 58200, oldPrice: 67400, currency: 'RUB', meal: 'breakfast', room: 'Deluxe, 2 взрослых', flight: { departureAirport: 'VKO', departureTime: '12:25', arrivalAirport: 'IST', arrivalTime: '16:20', direct: true }, badge: 'sale', tags: ['Завтраки', 'Центр', '−14%'], troveScore: 87, reasons: ['Отель в историческом центре', 'Цена ниже средней', 'Прямой рейс'], priceUpdatedAt: new Date().toISOString()
  },
  {
    id: 'vn-01', provider: 'TravelHub', providerOfferId: 'B-2003', title: 'Тихий отдых во Вьетнаме', hotel: 'Anantara Mui Ne Resort', city: 'Муйне', destination: 'Вьетнам', countryCode: 'VN', image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=85', rating: 4.8, reviews: 704, duration: 11, departureDate: '8 ноя', departure: 'Москва', price: 127900, currency: 'RUB', meal: 'breakfast', room: 'Deluxe, 2 взрослых', flight: { departureAirport: 'SVO', departureTime: '19:20', arrivalAirport: 'SGN', arrivalTime: '09:15', direct: false }, tags: ['Пляж', 'Тишина', 'Завтраки'], troveScore: 86, reasons: ['Спокойный пляжный отдых', 'Отличный рейтинг', '11 ночей'], priceUpdatedAt: new Date().toISOString()
  },
  {
    id: 'mediterranean-duplicate', provider: 'TravelHub', providerOfferId: 'B-2004', title: 'Анталья — семейный отдых', hotel: 'Lara Family Resort', city: 'Анталья', destination: 'Турция', countryCode: 'TR', image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85', rating: 4.8, reviews: 1240, duration: 8, departureDate: '12 окт', departure: 'Москва', price: 89200, oldPrice: 103900, currency: 'RUB', meal: 'all-inclusive', room: 'Standard, 2 взрослых', flight: { departureAirport: 'SVO', departureTime: '06:20', arrivalAirport: 'AYT', arrivalTime: '10:35', direct: true }, tags: ['All Inclusive', 'Прямой рейс'], troveScore: 93, reasons: ['Похожее предложение по другой цене', 'Рейтинг отеля 4.8 из 5', 'Прямой перелёт'], priceUpdatedAt: new Date().toISOString()
  },
]

export class MockProviderB implements TravelProvider {
  readonly id = 'mock-b'
  readonly name = 'Mock Provider B'
  readonly capabilities = { search: true, priceCheck: true, booking: false, redirect: true } as const
  async search(_params: SearchParams) { return offers.map((offer) => ({ ...offer, priceUpdatedAt: new Date().toISOString(), sourceUrl: `https://demo.trove.local/offers/${offer.providerOfferId}`, bookingUrl: `https://demo.trove.local/book/${offer.id}` })) }
  async checkPrice(id: string) { const offer = await this.getOffer(id); return offer ? { available: true, price: offer.price, currency: offer.currency, checkedAt: new Date().toISOString() } : null }
  async getOffer(id: string) { const offer = offers.find((offer) => offer.id === id); return offer ? { ...offer, priceUpdatedAt: new Date().toISOString(), sourceUrl: `https://demo.trove.local/offers/${offer.providerOfferId}`, bookingUrl: `https://demo.trove.local/book/${offer.id}` } : null }
}
