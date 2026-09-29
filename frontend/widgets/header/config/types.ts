import { type Component } from "nuxt/schema";
import { type LucideIcon } from '@lucide/vue'

export interface NavigationData {
  id: number;
  title: string;
  href: string;
  icon: Component | LucideIcon | string;
}