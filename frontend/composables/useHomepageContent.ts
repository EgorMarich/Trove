import { useApi } from './useApi'

export const useHomepageContent = () => {
  const api = useApi()
  const { locale } = useI18n()
  const content = useState<any>('trove-home-content', () => ({ promotions: [], blocks: [] }))
  const loading = ref(false)
  const load = async () => {
    loading.value = true
    try {
      content.value = await api('/content/home', { query: { locale: locale.value } })
    } catch {
      content.value = { promotions: [], blocks: [] }
    } finally {
      loading.value = false
    }
  }
  watch(locale, load, { immediate: true })
  return { content, loading, load }
}
