import { ExternalLink, LogOut } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import Preferences from '../components/Preferences'

export default function AdminShell({ children, copy, session, onLogout }) {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="page-shell admin-header-row">
          <Link className="admin-brand" to="/">
            Steve Huang <span className="text-muted">/ Writing</span>
          </Link>
          <div className="admin-nav">
            <nav className="nav-links" aria-label={copy.dashboard}>
              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
                end
                to="/"
              >
                {copy.dashboard}
              </NavLink>
              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
                to="/articles/new"
              >
                {copy.newArticle}
              </NavLink>
            </nav>
            <Preferences />
            <span className="admin-user">
              {session?.user?.name || session?.user?.login || 'Admin'}
            </span>
            <button className="text-link" onClick={onLogout} type="button">
              <LogOut size={15} aria-hidden="true" />
              {copy.logout}
            </button>
          </div>
        </div>
      </header>
      <main className="section-shell">{children}</main>
      <footer className="site-footer">
        <div className="page-shell footer-row">
          <p>{copy.footer}</p>
          <a
            className="text-link"
            href="https://gfm156.com/blog"
            rel="noreferrer"
            target="_blank"
          >
            {copy.openPublicSite}
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        </div>
      </footer>
    </div>
  )
}
