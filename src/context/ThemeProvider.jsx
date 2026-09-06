import { startTransition, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { ThemeContext } from './themeContext'

const STORAGE_KEY = 'steve-site-theme'

function getDefaultTheme() {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getDefaultTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem(STORAGE_KEY, theme)

    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0e0c0a' : '#f4efe7')
    }
  }, [theme])

  const setTheme = (nextTheme) => {
    const resolvedTheme = nextTheme === 'dark' ? 'dark' : 'light'

    if (resolvedTheme === theme) {
      return
    }

    const root = document.documentElement
    const applyTheme = () => {
      setThemeState(resolvedTheme)
    }

    if (typeof document.startViewTransition !== 'function') {
      startTransition(applyTheme)
      return
    }

    root.dataset.transitionMode = 'theme'

    const transition = document.startViewTransition(() => {
      flushSync(applyTheme)
    })

    transition.finished.finally(() => {
      if (root.dataset.transitionMode === 'theme') {
        delete root.dataset.transitionMode
      }
    })
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider
      value={{
        isDark: theme === 'dark',
        setTheme,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
