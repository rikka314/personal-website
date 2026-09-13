import { Moon, Sun } from 'lucide-react'
import { useLocale } from '../context/useLocale'
import { useTheme } from '../context/useTheme'

export default function Preferences() {
  const { locale, setLocale } = useLocale()
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="preferences">
      <div
        className="locale-switch"
        role="group"
        aria-label={locale === 'zh' ? '切换语言' : 'Language'}
      >
        {[
          ['en', 'EN'],
          ['zh', '中文'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`locale-option ${locale === value ? 'locale-option-active' : ''}`}
            aria-pressed={locale === value}
            onClick={() => setLocale(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-pressed={isDark}
        aria-label={locale === 'zh' ? '深色主题' : 'Dark theme'}
      >
        {isDark ? (
          <Moon size={18} aria-hidden="true" />
        ) : (
          <Sun size={18} aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
