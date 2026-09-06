import { Suspense, lazy, useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useOutlet,
} from 'react-router-dom'
import About from './components/About'
import Analytics from './components/Analytics'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Navbar from './components/Navbar'
import {
  getAdminBasename,
  getAdminPathCanonicalUrl,
  getSiteSurface,
  shouldCanonicalizeAdminPathHost,
} from './lib/site'

const AdminApp = lazy(() => import('./admin/AdminApp'))
const Blog = lazy(() => import('./components/Blog'))
const BlogColumn = lazy(() => import('./components/BlogColumn'))
const BlogPost = lazy(() => import('./components/BlogPost'))
const Projects = lazy(() => import('./components/Projects'))

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 })
  }, [pathname])

  return null
}

function HomePage() {
  return (
    <>
      <Hero />
      <About />
    </>
  )
}

function AnimatedOutlet() {
  const location = useLocation()
  const outlet = useOutlet()
  const isHomeRoute = location.pathname === '/'
  const transitionClassName = isHomeRoute
    ? 'route-transition route-transition-home'
    : 'route-transition route-transition-slide'

  return (
    <div
      key={location.pathname}
      className={transitionClassName}
      data-route-kind={isHomeRoute ? 'home' : 'page'}
    >
      {outlet}
    </div>
  )
}

function SiteLayout() {
  return (
    <div className="site-shell text-text">
      <ScrollToTop />
      <Analytics />
      <Navbar />
      <main className="pt-20 md:pt-24">
        <AnimatedOutlet />
      </main>
      <Footer />
    </div>
  )
}

function RouteFallback() {
  return (
    <section className="section-shell">
      <div className="page-shell">
        <div className="panel p-8">
          <p className="tiny-label">Loading</p>
          <p className="mt-3 text-base leading-7 text-muted">
            Loading the next section of the site.
          </p>
        </div>
      </div>
    </section>
  )
}

function CanonicalAdminPathRedirect() {
  useEffect(() => {
    window.location.replace(getAdminPathCanonicalUrl())
  }, [])

  return <RouteFallback />
}

function PublicApp() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/columns/:columnSlug" element={<BlogColumn />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  const surface = getSiteSurface()
  const isAdminSurface = surface === 'admin' || surface === 'admin-path'
  const basename = surface === 'admin-path' ? getAdminBasename() : undefined

  if (surface === 'admin-path' && shouldCanonicalizeAdminPathHost()) {
    return <CanonicalAdminPathRedirect />
  }

  return (
    <BrowserRouter basename={basename}>
      <Suspense fallback={<RouteFallback />}>
        {isAdminSurface ? <AdminApp /> : <PublicApp />}
      </Suspense>
    </BrowserRouter>
  )
}
