export type CountryOption = { code: string; name: string; flag: string; cities: string[] }

export const COUNTRIES: CountryOption[] = [
  { code: 'TR', name: 'Турция', flag: '🇹🇷', cities: ['Анталья', 'Стамбул', 'Бодрум', 'Даламан'] },
  { code: 'EG', name: 'Египет', flag: '🇪🇬', cities: ['Хургада', 'Шарм-эль-Шейх', 'Каир', 'Дахаб'] },
  { code: 'AE', name: 'ОАЭ', flag: '🇦🇪', cities: ['Дубай', 'Абу-Даби', 'Шарджа', 'Рас-эль-Хайма'] },
  { code: 'TH', name: 'Таиланд', flag: '🇹🇭', cities: ['Пхукет', 'Бангкок', 'Самуи', 'Краби'] },
  { code: 'VN', name: 'Вьетнам', flag: '🇻🇳', cities: ['Нячанг', 'Фукуок', 'Муйне', 'Хошимин'] },
  { code: 'ES', name: 'Испания', flag: '🇪🇸', cities: ['Барселона', 'Майорка', 'Тенерифе', 'Мадрид'] },
  { code: 'IT', name: 'Италия', flag: '🇮🇹', cities: ['Рим', 'Милан', 'Венеция', 'Сицилия'] },
  { code: 'GR', name: 'Греция', flag: '🇬🇷', cities: ['Афины', 'Крит', 'Родос', 'Корфу'] },
  { code: 'CY', name: 'Кипр', flag: '🇨🇾', cities: ['Лимасол', 'Ларнака', 'Пафос', 'Айя-Напа'] },
  { code: 'GE', name: 'Грузия', flag: '🇬🇪', cities: ['Тбилиси', 'Батуми', 'Кутаиси'] },
  { code: 'ME', name: 'Черногория', flag: '🇲🇪', cities: ['Будва', 'Котор', 'Тиват', 'Бар'] },
  { code: 'PT', name: 'Португалия', flag: '🇵🇹', cities: ['Лиссабон', 'Порту', 'Мадейра', 'Алгарве'] },
  { code: 'FR', name: 'Франция', flag: '🇫🇷', cities: ['Париж', 'Ницца', 'Лион', 'Марсель'] },
  { code: 'ID', name: 'Индонезия', flag: '🇮🇩', cities: ['Бали', 'Джакарта', 'Ломбок'] },
  { code: 'LK', name: 'Шри-Ланка', flag: '🇱🇰', cities: ['Коломбо', 'Бентота', 'Унаватуна', 'Канди'] },
  { code: 'MV', name: 'Мальдивы', flag: '🇲🇻', cities: ['Мале', 'Ари-Атолл', 'Ба-Атолл'] },
  { code: 'MA', name: 'Марокко', flag: '🇲🇦', cities: ['Марракеш', 'Агадир', 'Касабланка'] },
  { code: 'QA', name: 'Катар', flag: '🇶🇦', cities: ['Доха'] },
  { code: 'OM', name: 'Оман', flag: '🇴🇲', cities: ['Маскат', 'Салала'] },
  { code: 'TZ', name: 'Танзания', flag: '🇹🇿', cities: ['Занзибар', 'Аруша'] },
  { code: 'MX', name: 'Мексика', flag: '🇲🇽', cities: ['Канкун', 'Тулум', 'Мехико'] },
]

export const POPULAR_COUNTRIES = COUNTRIES.slice(0, 8)
