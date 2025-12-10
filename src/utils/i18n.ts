import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import config from '@/config'

export function getDefaultLang() {
  if (typeof window !== 'undefined') {
    // 优先 localStorage，其次浏览器语言
    return (
      localStorage.getItem('language')
      || navigator.language.split('-')[0]
      || 'zh'
    )
  }
  return 'zh'
}

i18n.use(initReactI18next).init({
  resources: config.languageResources,
  lng: getDefaultLang(),
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
