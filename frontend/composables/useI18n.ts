import { computed, ref } from 'vue'

type Locale = 'ru'|'en'|'es'|'kk'
const locale = ref<Locale>('ru')
const ready = ref(false)

const messages: Record<Locale, Record<string,string>> = {
  ru: {
    navTours:'Туры', navHot:'Горящие', navGuides:'Гид', navSupport:'Поддержка', login:'Войти', register:'Регистрация',
    search:'Найти путешествие', destinations:'Куда хочется прямо сейчас?', all:'Смотреть все', featured:'Туры, которые стоит открыть',
    inspiration:'Вдохновение до покупки', hotTitle:'Иногда хорошая поездка находится внезапно.', nextTrip:'Следующая поездка', newsletter:'Идеи для следующей поездки.',
    lang:'Язык', promotion:'Акции', promotions:'Спецпредложения', learnMore:'Подробнее', from:'от', compare:'Сравнить предложения',
  },
  en: {
    navTours:'Tours', navHot:'Hot deals', navGuides:'Guide', navSupport:'Support', login:'Log in', register:'Sign up',
    search:'Find a trip', destinations:'Where do you want to go right now?', all:'View all', featured:'Tours worth opening',
    inspiration:'Inspiration before booking', hotTitle:'Sometimes a great trip appears unexpectedly.', nextTrip:'Your next trip', newsletter:'Ideas for your next trip.',
    lang:'Language', promotion:'Deals', promotions:'Special offers', learnMore:'Learn more', from:'from', compare:'Compare offers',
  },
  es: {
    navTours:'Viajes', navHot:'Ofertas', navGuides:'Guía', navSupport:'Ayuda', login:'Entrar', register:'Registrarse',
    search:'Buscar viaje', destinations:'¿Adónde quieres ir ahora?', all:'Ver todo', featured:'Viajes que merece la pena descubrir',
    inspiration:'Inspiración antes de reservar', hotTitle:'A veces aparece un viaje increíble de repente.', nextTrip:'Tu próximo viaje', newsletter:'Ideas para tu próximo viaje.',
    lang:'Idioma', promotion:'Promociones', promotions:'Ofertas especiales', learnMore:'Más información', from:'desde', compare:'Comparar ofertas',
  },
  kk: {
    navTours:'Турлар', navHot:'Ыстық ұсыныстар', navGuides:'Гид', navSupport:'Қолдау', login:'Кіру', register:'Тіркелу',
    search:'Саяхат табу', destinations:'Қазір қайда барғыңыз келеді?', all:'Барлығын көру', featured:'Ашу керек турлар',
    inspiration:'Бронь алдында шабыт', hotTitle:'Кейде жақсы саяхат күтпеген жерден табылады.', nextTrip:'Келесі сапарыңыз', newsletter:'Келесі сапарға идеялар.',
    lang:'Тіл', promotion:'Акциялар', promotions:'Арнайы ұсыныстар', learnMore:'Толығырақ', from:'бастап', compare:'Ұсыныстарды салыстыру',
  },
}

export const useI18n = () => {
  if (import.meta.client && !ready.value) {
    const stored = localStorage.getItem('trove_locale') as Locale | null
    if (stored && messages[stored]) locale.value = stored
    ready.value = true
  }
  const t = (key:string) => messages[locale.value][key] || messages.ru[key] || key
  const setLocale = (next:Locale) => { locale.value=next; if(import.meta.client)localStorage.setItem('trove_locale',next) }
  return { locale: computed(()=>locale.value), t, setLocale, locales: Object.keys(messages) as Locale[] }
}
