import { useEffect, useMemo, useRef } from 'react'
import { useLocale } from '../context/useLocale'
import { useTheme } from '../context/useTheme'

export default function GiscusComments({ term }) {
  const containerRef = useRef(null)
  const { locale } = useLocale()
  const { isDark } = useTheme()

  const config = useMemo(
    () => ({
      repo: import.meta.env.VITE_GISCUS_REPO,
      repoId: import.meta.env.VITE_GISCUS_REPO_ID,
      category: import.meta.env.VITE_GISCUS_CATEGORY,
      categoryId: import.meta.env.VITE_GISCUS_CATEGORY_ID,
    }),
    [],
  )

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    containerRef.current.innerHTML = ''

    if (!config.repo || !config.repoId || !config.category || !config.categoryId) {
      return
    }

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.setAttribute('data-repo', config.repo)
    script.setAttribute('data-repo-id', config.repoId)
    script.setAttribute('data-category', config.category)
    script.setAttribute('data-category-id', config.categoryId)
    script.setAttribute('data-mapping', 'specific')
    script.setAttribute('data-term', term)
    script.setAttribute('data-strict', '1')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'top')
    script.setAttribute('data-theme', isDark ? 'dark' : 'light')
    script.setAttribute('data-lang', locale === 'zh' ? 'zh-CN' : 'en')

    containerRef.current.append(script)
  }, [config.category, config.categoryId, config.repo, config.repoId, isDark, locale, term])

  if (!config.repo || !config.repoId || !config.category || !config.categoryId) {
    return null
  }

  return <div ref={containerRef} />
}
