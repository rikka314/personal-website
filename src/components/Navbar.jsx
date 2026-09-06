import { useEffect, useState } from 'react'
import { Menu, MoonStar, SunMedium, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useLocale } from '../context/useLocale'
import { useTheme } from '../context/useTheme'

function getDesktopLinkClass(isActive) {
  return `rounded-full px-4 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-card text-text shadow-[0_18px_40px_rgba(0,0,0,0.18)] ring-1 ring-border'
      : 'text-muted hover:bg-card/70 hover:text-text'
  }`
}

function getMobileLinkClass(isActive) {
  return `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
    isActive
      ? 'bg-card text-text shadow-[0_12px_32px_rgba(191,90,50,0.08)] ring-1 ring-border'
      : 'text-muted hover:bg-card/70 hover:text-text'
  }`
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { locale, setLocale } = useLocale()
  const { isDark, setTheme, theme } = useTheme()

  const navLinks =
    locale === 'zh'
      ? [
          { label: '关于', to: '/', end: true },
          { label: '项目', to: '/projects' },
          { label: '博客', to: '/blog' },
        ]
      : [
          { label: 'About', to: '/', end: true },
          { label: 'Projects', to: '/projects' },
          { label: 'Blog', to: '/blog' },
        ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMenu = () => {
    setIsOpen(false)
  }

  const localeLabel = locale === 'zh' ? '切换语言' : 'Switch language'
  const themeLabel = locale === 'zh' ? '切换主题' : 'Switch theme'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'border-b border-border/80 bg-bg/88 shadow-[0_10px_45px_rgba(0,0,0,0.12)] backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="page-shell">
        <div className="flex items-center justify-between py-4">
          <NavLink
            className="text-2xl leading-none tracking-tight text-text transition hover:text-accent-hi md:text-3xl"
            to="/"
            viewTransition
          >
            <span className="font-display italic">Steve Huang</span>
          </NavLink>

          <div className="hidden items-center gap-3 md:flex">
            <nav className="flex items-center gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  className={({ isActive }) => getDesktopLinkClass(isActive)}
                  end={link.end}
                  onClick={closeMenu}
                  to={link.to}
                  viewTransition
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div aria-label={localeLabel} className="locale-switch" role="group">
              <button
                className={`locale-option ${locale === 'en' ? 'locale-option-active' : ''}`}
                onClick={() => setLocale('en')}
                type="button"
              >
                EN
              </button>
              <button
                className={`locale-option ${locale === 'zh' ? 'locale-option-active' : ''}`}
                onClick={() => setLocale('zh')}
                type="button"
              >
                中文
              </button>
            </div>

            <div aria-label={themeLabel} className="theme-switch" role="group">
              <button
                className={`theme-option ${theme === 'light' ? 'theme-option-active' : ''}`}
                onClick={() => setTheme('light')}
                title={locale === 'zh' ? '浅色' : 'Light'}
                type="button"
              >
                <SunMedium size={15} />
              </button>
              <button
                className={`theme-option ${theme === 'dark' ? 'theme-option-active' : ''}`}
                onClick={() => setTheme('dark')}
                title={locale === 'zh' ? '深色' : 'Dark'}
                type="button"
              >
                <MoonStar size={15} />
              </button>
            </div>
          </div>

          <button
            aria-label={
              isOpen
                ? locale === 'zh'
                  ? '关闭导航菜单'
                  : 'Close navigation menu'
                : locale === 'zh'
                  ? '打开导航菜单'
                  : 'Open navigation menu'
            }
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-text transition hover:border-accent/50 hover:text-accent-hi md:hidden"
            onClick={() => setIsOpen((open) => !open)}
            type="button"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {isOpen && (
          <nav className="panel mb-4 p-3 md:hidden">
            <div className="mb-3 flex flex-wrap justify-end gap-2">
              <div aria-label={localeLabel} className="locale-switch" role="group">
                <button
                  className={`locale-option ${locale === 'en' ? 'locale-option-active' : ''}`}
                  onClick={() => setLocale('en')}
                  type="button"
                >
                  EN
                </button>
                <button
                  className={`locale-option ${locale === 'zh' ? 'locale-option-active' : ''}`}
                  onClick={() => setLocale('zh')}
                  type="button"
                >
                  中文
                </button>
              </div>

              <div aria-label={themeLabel} className="theme-switch" role="group">
                <button
                  className={`theme-option ${!isDark ? 'theme-option-active' : ''}`}
                  onClick={() => setTheme('light')}
                  title={locale === 'zh' ? '浅色' : 'Light'}
                  type="button"
                >
                  <SunMedium size={15} />
                </button>
                <button
                  className={`theme-option ${isDark ? 'theme-option-active' : ''}`}
                  onClick={() => setTheme('dark')}
                  title={locale === 'zh' ? '深色' : 'Dark'}
                  type="button"
                >
                  <MoonStar size={15} />
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  className={({ isActive }) => getMobileLinkClass(isActive)}
                  end={link.end}
                  onClick={closeMenu}
                  to={link.to}
                  viewTransition
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
