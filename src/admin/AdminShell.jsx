import { ExternalLink, FilePenLine, LogOut } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

function navClassName({ isActive }) {
  return `rounded-full px-4 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-card text-text shadow-[0_18px_40px_rgba(0,0,0,0.18)] ring-1 ring-border'
      : 'text-muted hover:bg-card/70 hover:text-text'
  }`
}

export default function AdminShell({ children, copy, session, onLogout }) {
  return (
    <div className="admin-shell">
      <header className="border-b border-border/80 bg-bg/88 backdrop-blur-xl">
        <div className="page-shell py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">{copy.eyebrow}</p>
              <h1 className="mt-2 text-3xl text-text md:text-4xl">
                <span className="font-display italic">write.gfm156.com</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <nav className="flex items-center gap-2">
                <NavLink className={navClassName} end to="/">
                  {copy.dashboard}
                </NavLink>
                <NavLink className={navClassName} to="/articles/new">
                  {copy.newArticle}
                </NavLink>
              </nav>

              <a
                className="button-secondary"
                href="https://gfm156.com/blog"
                rel="noreferrer"
                target="_blank"
              >
                {copy.openPublicSite}
                <ExternalLink size={15} />
              </a>

              <div className="soft-surface flex items-center gap-3 px-4 py-3">
                {session?.user?.avatarUrl ? (
                  <img
                    alt={session.user.login}
                    className="h-10 w-10 rounded-full object-cover"
                    src={session.user.avatarUrl}
                  />
                ) : (
                  <div className="icon-shell h-10 w-10">
                    <FilePenLine size={18} />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-text">
                    {session?.user?.name || session?.user?.login || 'Admin'}
                  </p>
                  <p className="text-xs text-muted">{session?.user?.login}</p>
                </div>
              </div>

              <button className="button-secondary" onClick={onLogout} type="button">
                <LogOut size={15} />
                {copy.logout}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="section-shell pt-10">{children}</main>

      <footer className="border-t border-border/80 py-8">
        <div className="page-shell flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <p>{copy.footer}</p>
          <Link className="blog-inline-link" to="/articles/new">
            {copy.newArticle}
          </Link>
        </div>
      </footer>
    </div>
  )
}
