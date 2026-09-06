import { getAdminApiUrl } from '../lib/site'

async function request(pathname, options = {}) {
  const response = await fetch(getAdminApiUrl(pathname), {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    ...options,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : null

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed: ${response.status}`)
  }

  return payload
}

export function getSession() {
  return request('/session')
}

export function loginWithPassword(password) {
  return request('/auth/password', {
    body: JSON.stringify({ password }),
    method: 'POST',
  })
}

export function logout() {
  return request('/logout', {
    method: 'POST',
  })
}

export function listArticles() {
  return request('/articles')
}

export function getArticle(id) {
  return request(`/articles/${id}`)
}

export function createArticle(payload) {
  return request('/articles', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function updateArticle(id, payload) {
  return request(`/articles/${id}`, {
    body: JSON.stringify(payload),
    method: 'PUT',
  })
}

export function publishArticle(id) {
  return request(`/articles/${id}/publish`, {
    method: 'POST',
  })
}

export function unpublishArticle(id) {
  return request(`/articles/${id}/unpublish`, {
    method: 'POST',
  })
}

export function deleteArticle(id) {
  return request(`/articles/${id}`, {
    method: 'DELETE',
  })
}

export function listColumns() {
  return request('/columns')
}

export function createColumn(payload) {
  return request('/columns', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function uploadAsset({ articleId, file }) {
  const formData = new FormData()
  formData.append('asset', file)
  if (articleId) {
    formData.append('articleId', articleId)
  }

  return request('/assets/upload', {
    body: formData,
    method: 'POST',
  })
}

export function importMarkdown({ assets, markdown, status }) {
  const formData = new FormData()
  formData.append('markdown', markdown)
  formData.append('status', status)

  for (const asset of assets) {
    formData.append('assets[]', asset)
  }

  return request('/import/markdown', {
    body: formData,
    method: 'POST',
  })
}
