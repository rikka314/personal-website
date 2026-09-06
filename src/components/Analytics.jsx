import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const scriptId = 'ga4-script'

function ensureGtag(measurementId) {
  if (typeof window === 'undefined' || !measurementId) {
    return
  }

  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script')
    script.id = scriptId
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.append(script)
  }

  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments)
    }

  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })
}

export default function Analytics() {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID
  const location = useLocation()

  useEffect(() => {
    ensureGtag(measurementId)
  }, [measurementId])

  useEffect(() => {
    if (!measurementId || typeof window.gtag !== 'function') {
      return
    }

    window.gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: `${location.pathname}${location.search}`,
      page_title: document.title,
    })
  }, [location.pathname, location.search, measurementId])

  return null
}
