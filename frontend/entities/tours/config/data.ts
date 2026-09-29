import type { Tour } from '~/types/tours'

export const DATA_TOURS: Tour[] = [
  {
    id: 'mediterranean-01', provider: 'Trove Demo Travel', providerOfferId: 'trove-demo-001', title: 'Пляжный отдых в Анталье', hotel: 'Lara Family Resort', city: 'Анталья', destination: 'Турция', countryCode: 'TR',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85', rating: 4.8, reviews: 1240, duration: 8, departureDate: '12 окт', departure: 'Москва', price: 87400, oldPrice: 103900, currency: 'RUB', meal: 'all-inclusive', room: 'Standard, 2 взрослых',
    flight: { departureAirport: 'SVO', departureTime: '06:20', arrivalAirport: 'AYT', arrivalTime: '10:35', direct: true }, badge: 'recommended', tags: ['All Inclusive', 'Прямой рейс', 'Пляж рядом'], troveScore: 94,
    priceUpdatedAt: new Date().toISOString(),
    reasons: ['Цена ниже похожих предложений на 16%', 'Рейтинг отеля 4.8 из 5', 'Прямой перелёт'],
  },
  {
    id: 'red-sea-01', provider: 'SunWay', providerOfferId: 'sunway-hrg-001', title: 'Море и солнце в Хургаде', hotel: 'Coral Beach Resort', city: 'Хургада', destination: 'Египет', countryCode: 'EG',
    image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=1200&q=85', rating: 4.6, reviews: 862, duration: 7, departureDate: '18 окт', departure: 'Москва', price: 64900, oldPrice: 82900, currency: 'RUB', meal: 'all-inclusive', room: 'Standard, 2 взрослых',
    flight: { departureAirport: 'VKO', departureTime: '08:10', arrivalAirport: 'HRG', arrivalTime: '13:00', direct: true }, badge: 'hot', tags: ['All Inclusive', '−22%', 'Пляж'], troveScore: 91,
    priceUpdatedAt: new Date().toISOString(),
    reasons: ['Цена снизилась на 18 000 ₽', 'Хороший рейтинг за эту цену', 'До пляжа 2 минуты'],
  },
  {
    id: 'ae-01', provider: 'TravelHub', providerOfferId: 'travelhub-dxb-001', title: 'Городской отпуск в Дубае', hotel: 'Rove Downtown', city: 'Дубай', destination: 'ОАЭ', countryCode: 'AE',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=85', rating: 4.7, reviews: 2104, duration: 6, departureDate: '22 окт', departure: 'Москва', price: 119800, currency: 'RUB', meal: 'breakfast', room: 'Rover Room, 2 взрослых',
    flight: { departureAirport: 'DME', departureTime: '09:40', arrivalAirport: 'DXB', arrivalTime: '16:10', direct: true }, badge: 'new', tags: ['Завтраки', 'Центр', 'Прямой рейс'], troveScore: 89,
    priceUpdatedAt: new Date().toISOString(),
    reasons: ['Отличная локация', 'Высокий рейтинг', 'Удобный прямой рейс'],
  },
  {
    id: 'thai-01', provider: 'SunWay', providerOfferId: 'sunway-hkt-001', title: 'Тропический Пхукет', hotel: 'Katathani Phuket Beach Resort', city: 'Пхукет', destination: 'Таиланд', countryCode: 'TH',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85', rating: 4.9, reviews: 1745, duration: 10, departureDate: '3 ноя', departure: 'Москва', price: 138500, currency: 'RUB', meal: 'breakfast', room: 'Deluxe, 2 взрослых',
    flight: { departureAirport: 'SVO', departureTime: '21:00', arrivalAirport: 'HKT', arrivalTime: '10:40', direct: false }, tags: ['Пляж', 'Завтраки', '★★★★★'], troveScore: 88,
    priceUpdatedAt: new Date().toISOString(),
    reasons: ['Почти идеальный рейтинг', 'Большой выбор ресторанов рядом', '10 ночей'],
  },
  {
    id: 'tr-istanbul-01', provider: 'CityBreak', providerOfferId: 'citybreak-ist-001', title: 'Стамбул: город, который не спит', hotel: 'The Wings Hotel', city: 'Стамбул', destination: 'Турция', countryCode: 'TR',
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=85', rating: 4.7, reviews: 936, duration: 5, departureDate: '10 окт', departure: 'Москва', price: 58200, oldPrice: 67400, currency: 'RUB', meal: 'breakfast', room: 'Deluxe, 2 взрослых',
    flight: { departureAirport: 'VKO', departureTime: '12:25', arrivalAirport: 'IST', arrivalTime: '16:20', direct: true }, badge: 'sale', tags: ['Завтраки', 'Центр', '−14%'], troveScore: 87,
    priceUpdatedAt: new Date().toISOString(),
    reasons: ['Отель в историческом центре', 'Цена ниже средней', 'Прямой рейс'],
  },
  {
    id: 'vn-01', provider: 'TravelHub', providerOfferId: 'travelhub-vn-001', title: 'Тихий отдых во Вьетнаме', hotel: 'Anantara Mui Ne Resort', city: 'Муйне', destination: 'Вьетнам', countryCode: 'VN',
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=85', rating: 4.8, reviews: 704, duration: 11, departureDate: '8 ноя', departure: 'Москва', price: 127900, currency: 'RUB', meal: 'breakfast', room: 'Deluxe, 2 взрослых',
    flight: { departureAirport: 'SVO', departureTime: '19:20', arrivalAirport: 'SGN', arrivalTime: '09:15', direct: false }, tags: ['Пляж', 'Тишина', 'Завтраки'], troveScore: 86,
    priceUpdatedAt: new Date().toISOString(),
    reasons: ['Спокойный пляжный отдых', 'Отличный рейтинг', '11 ночей'],
  },
]
