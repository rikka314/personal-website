import { startTransition, useEffect, useState } from 'react'
import { LocaleContext } from './localeContext'

const STORAGE_KEY = 'steve-site-locale'

function getDefaultLocale() {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const savedLocale = window.localStorage.getItem(STORAGE_KEY)
  if (savedLocale === 'en' || savedLocale === 'zh') {
    return savedLocale
  }

  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(getDefaultLocale)

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const setLocale = (nextLocale) => {
    startTransition(() => {
      setLocaleState(nextLocale === 'zh' ? 'zh' : 'en')
    })
  }

  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh')
  }

  return (
    <LocaleContext.Provider
      value={{
        isZh: locale === 'zh',
        locale,
        setLocale,
        toggleLocale,
      }}
    >
      {children}
    </LocaleContext.Provider>
  )
}
