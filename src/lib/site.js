export const PUBLIC_RUNTIME_BASE =
  import.meta.env.VITE_BLOG_RUNTIME_BASE_URL?.replace(/\/$/, '') || '/blog-runtime'

export const ADMIN_API_BASE =
  import.meta.env.VITE_ADMIN_API_BASE_URL?.replace(/\/$/, '') || '/api'
export const ADMIN_PATH_PREFIX = '/write'
export const ADMIN_PATH_CANONICAL_HOSTNAME = 'gfm156.com'

export const PUBLIC_HOSTNAMES = new Set(['gfm156.com', 'www.gfm156.com'])
export const ADMIN_HOSTNAMES = new Set(['write.gfm156.com'])

export function isAdminPathRequest(
  hostname = globalThis?.window?.location?.hostname ?? '',
  pathname = globalThis?.window?.location?.pathname ?? '/',
) {
  return (
    PUBLIC_HOSTNAMES.has(hostname)
    && (pathname === ADMIN_PATH_PREFIX || pathname.startsWith(`${ADMIN_PATH_PREFIX}/`))
  )
}

export function getSiteSurface(
  hostname = globalThis?.window?.location?.hostname ?? '',
  pathname = globalThis?.window?.location?.pathname ?? '/',
) {
  if (import.meta.env.VITE_SITE_SURFACE === 'admin') {
    return 'admin'
  }

  if (import.meta.env.VITE_SITE_SURFACE === 'public') {
    return 'public'
  }

  if (ADMIN_HOSTNAMES.has(hostname)) {
    return 'admin'
  }

  if (isAdminPathRequest(hostname, pathname)) {
    return 'admin-path'
  }

  return 'public'
}

export function getAdminBasename() {
  return getSiteSurface() === 'admin-path' ? ADMIN_PATH_PREFIX : '/'
}

export function getPublicRuntimeUrl(pathname = '') {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${PUBLIC_RUNTIME_BASE}${normalizedPath}`
}

export function shouldCanonicalizeAdminPathHost(
  hostname = globalThis?.window?.location?.hostname ?? '',
  pathname = globalThis?.window?.location?.pathname ?? '/',
) {
  return isAdminPathRequest(hostname, pathname) && hostname !== ADMIN_PATH_CANONICAL_HOSTNAME
}

export function getAdminPathCanonicalUrl(
  pathname = globalThis?.window?.location?.pathname ?? `${ADMIN_PATH_PREFIX}/`,
  search = globalThis?.window?.location?.search ?? '',
  hash = globalThis?.window?.location?.hash ?? '',
  protocol = globalThis?.window?.location?.protocol ?? 'https:',
) {
  return `${protocol}//${ADMIN_PATH_CANONICAL_HOSTNAME}${pathname}${search}${hash}`
}

export function getAdminApiUrl(pathname = '') {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  const base =
    getSiteSurface() === 'admin-path' ? `${ADMIN_PATH_PREFIX}${ADMIN_API_BASE}` : ADMIN_API_BASE

  return `${base}${normalizedPath}`
}

export function getAdminLoginUrl() {
  const relativeLoginUrl = getAdminApiUrl('/auth/login')
  if (getSiteSurface() !== 'admin-path') {
    return relativeLoginUrl
  }

  const protocol = globalThis?.window?.location?.protocol ?? 'https:'
  return `${protocol}//${ADMIN_PATH_CANONICAL_HOSTNAME}${relativeLoginUrl}`
}

export function isAdminSurface() {
  const surface = getSiteSurface()
  return surface === 'admin' || surface === 'admin-path'
}

export function isPublicSurface() {
  return getSiteSurface() === 'public'
}
