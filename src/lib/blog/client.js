import { blogArticlesSeed, blogColumnsSeed } from '../../data/blogSeed'
import { getProjectSearchEntries } from '../../data/projects'
import { getPublicRuntimeUrl } from '../site'
import { buildBlogRuntime } from './runtime'

const allowLocalSeedFallback =
  import.meta.env.DEV || import.meta.env.VITE_BLOG_RUNTIME_LOCAL_FALLBACK === 'true'

const localRuntime = buildBlogRuntime({
  articles: blogArticlesSeed,
  columns: blogColumnsSeed,
  projects: getProjectSearchEntries(),
})

let indexPromise
let searchPromise
const articlePromises = new Map()

async function requestRuntimeJson(pathname) {
  const response = await fetch(getPublicRuntimeUrl(pathname), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${pathname}`)
  }

  return response.json()
}

export function getLocalRuntime() {
  return localRuntime
}

export function loadBlogIndex() {
  if (!indexPromise) {
    indexPromise = allowLocalSeedFallback
      ? requestRuntimeJson('/index.json').catch(() => localRuntime.index)
      : requestRuntimeJson('/index.json')
  }

  return indexPromise
}

export function loadBlogSearch() {
  if (!searchPromise) {
    searchPromise = allowLocalSeedFallback
      ? requestRuntimeJson('/search.json').catch(() => localRuntime.search)
      : requestRuntimeJson('/search.json')
  }

  return searchPromise
}

export function loadBlogArticle(slug) {
  if (!articlePromises.has(slug)) {
    articlePromises.set(
      slug,
      allowLocalSeedFallback
        ? requestRuntimeJson(`/articles/${slug}.json`).catch(() => localRuntime.articleDetails[slug] ?? null)
        : requestRuntimeJson(`/articles/${slug}.json`),
    )
  }

  return articlePromises.get(slug)
}
