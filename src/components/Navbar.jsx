import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useLocale } from '../context/useLocale'
import Preferences from './Preferences'

export default function Navbar() {
  const [openPath, setOpenPath] = useState(null)
  const { pathname } = useLocation()
  const isOpen = openPath === pathname
  const buttonRef = useRef(null)
  const { locale } = useLocale()
  const links = [
    { to: '/', label: locale === 'zh' ? '关于' : 'About', end: true },
    { to: '/projects', label: locale === 'zh' ? '项目' : 'Projects' },
    { to: '/blog', label: locale === 'zh' ? '博客' : 'Writing' },
  ]
  useEffect(() => {
    const close = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setOpenPath(null)
        buttonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [isOpen])
  const navigation = (
    <div className="nav-links">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={() => setOpenPath(null)}
          className={({ isActive }) =>
            `nav-link ${isActive ? 'nav-link-active' : ''}`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  )
  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">
        {locale === 'zh' ? '跳至正文' : 'Skip to content'}
      </a>
      <div className="page-shell">
        <div className="navbar-row">
          <NavLink className="wordmark" to="/">
            Steve Huang<span className="text-accent">.</span>
          </NavLink>
          <div className="desktop-nav">
            <nav aria-label={locale === 'zh' ? '主导航' : 'Main navigation'}>
              {navigation}
            </nav>
            <Preferences />
          </div>
          <button
            ref={buttonRef}
            type="button"
            className="menu-button"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label={
              locale === 'zh'
                ? isOpen
                  ? '关闭菜单'
                  : '打开菜单'
                : isOpen
                  ? 'Close menu'
                  : 'Open menu'
            }
            onClick={() => setOpenPath(isOpen ? null : pathname)}
          >
            {isOpen ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
          </button>
        </div>
        {isOpen && (
          <nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label={locale === 'zh' ? '移动导航' : 'Mobile navigation'}
          >
            {navigation}
            <Preferences />
          </nav>
        )}
      </div>
    </header>
  )
}
