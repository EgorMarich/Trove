import { type NavigationData } from './types'
import { Flame, Heart, Compass } from '@lucide/vue'

export const NAV_DATA: NavigationData[] = [
  {
    id: 1,
    title: 'Горящие',
    href: '/hot',
    icon: Flame,
  },
  {
    id: 2,
    title: 'Туры',
    href: '/tours',
    icon: Compass,
  },
  {
    id: 3,
    title: 'Избранное',
    href: '/favorites',
    icon: Heart,
  },
]
