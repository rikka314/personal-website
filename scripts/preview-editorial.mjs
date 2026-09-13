// Isolated UI fixture servers. Memory-only content; never connects to production.
import { createServer } from 'vite'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { buildBlogRuntime } from '../src/lib/blog/runtime.js'
import { getProjectSearchEntries } from '../src/data/projects.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const sample = matter(
  await readFile(
    new URL('../public/posts/research-ready-local-ai.zh.md', import.meta.url),
    'utf8',
  ),
).content
let articles = Array.from({ length: 14 }, (_, i) => ({
  id: `preview-${i + 1}`,
  slug: `preview-${i + 1}`,
  title:
    i === 0
      ? '从模型复现到研究实践：本地 AI 工作流'
      : `Research notebook ${String(i + 1).padStart(2, '0')}`,
  excerpt:
    i === 0
      ? '关于模型复现、实验记录与工程实践的笔记。此内容仅用于本地排版验收。'
      : 'Notes on reproducible experiments, model evaluation, and building useful research tools.',
  contentMarkdown:
    i === 0
      ? sample
      : '## Experiment notes\n\nAn inline `baseline` and a reproducible experiment.\n\n```python\nprint("research")\n```\n\n## Results\n\n| Model | Score |\n| --- | --- |\n| Baseline | 0.85 |\n\n$$\\sum_{i=1}^{n} x_i$$\n\n- Reproduce\n- Evaluate\n',
  language: i === 0 ? 'zh' : 'en',
  type: i % 2 ? 'note' : 'tutorial',
  column: 'research',
  tags: ['AI', 'Research'],
  status: i === 13 ? 'draft' : 'published',
  pinned: i === 0,
  pinOrder: 1,
  publishedAt: new Date(2026, 8, 6 - i).toISOString(),
  enableComments: false,
}))
const columns = [
  {
    slug: 'research',
    name: { en: 'Research notes', zh: '研究笔记' },
    description: {
      en: 'Local preview of the research archive.',
      zh: '研究与工程实践的本地预览。',
    },
  },
]
let authenticated = true
let failNext = false
const requests = []
function fixturePlugin() {
  return {
    name: 'isolated-editorial-fixtures',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = new URL(req.url, 'http://localhost').pathname
        if (
          !path.startsWith('/api/') &&
          !path.startsWith('/blog-runtime/') &&
          !path.startsWith('/__fixture/')
        )
          return next()
        const json = (value, status = 200) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(value))
        }
        if (path === '/__fixture/fail-next') {
          failNext = true
          return json({ ok: true })
        }
        if (path === '/__fixture/requests') return json(requests)
        requests.push({ method: req.method, path })
        if (failNext) {
          failNext = false
          return json({ error: 'Preview: simulated request failure.' }, 503)
        }
        try {
          if (path.startsWith('/blog-runtime/')) {
            const runtime = buildBlogRuntime({
              articles,
              columns,
              projects: getProjectSearchEntries(),
            })
            if (path.endsWith('/index.json')) return json(runtime.index)
            if (path.endsWith('/search.json')) return json(runtime.search)
            const slug = path.split('/').pop().replace('.json', '')
            return runtime.articleDetails[slug]
              ? json(runtime.articleDetails[slug])
              : json({ error: 'Not found' }, 404)
          }
          if (path === '/api/session')
            return json({
              authenticated,
              authConfigured: true,
              passwordAuthConfigured: true,
              oauthConfigured: false,
              user: { login: 'local-preview', name: 'Local preview' },
            })
          if (path === '/api/logout') {
            authenticated = false
            return json({ ok: true })
          }
          if (path === '/api/auth/password') {
            authenticated = true
            return json({ user: { login: 'local-preview' } })
          }
          if (!authenticated) return json({ error: 'Sign in required' }, 401)
          let payload = {}
          if (!['GET', 'HEAD'].includes(req.method)) {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const buffer = Buffer.concat(chunks)
            if (req.headers['content-type']?.includes('multipart/form-data')) {
              payload = await new Request('http://localhost', {
                method: 'POST',
                headers: { 'content-type': req.headers['content-type'] },
                body: buffer,
              }).formData()
            } else if (buffer.length) payload = JSON.parse(buffer.toString())
          }
          if (path === '/api/columns') {
            if (req.method === 'POST') {
              columns.push(payload)
              return json({ column: payload })
            }
            return json({ columns })
          }
          if (path === '/api/assets/upload')
            return json({ asset: { url: '/favicon.svg' } })
          if (path === '/api/import/markdown') {
            const parsed = matter(await payload.get('markdown').text())
            const id = `preview-${Date.now()}`
            const article = {
              ...articles[0],
              id,
              slug: id,
              title: parsed.data.title || 'Imported preview',
              contentMarkdown: parsed.content,
              status: payload.get('status'),
            }
            articles.unshift(article)
            return json({ article })
          }
          if (path === '/api/articles') {
            if (req.method === 'POST') {
              const article = { ...payload, id: `preview-${Date.now()}` }
              articles.unshift(article)
              return json({ article })
            }
            return json({ articles })
          }
          const match = path.match(
            /^\/api\/articles\/([^/]+)(?:\/(publish|unpublish))?$/,
          )
          if (match) {
            const article = articles.find((item) => item.id === match[1])
            if (!article) return json({ error: 'Not found' }, 404)
            if (req.method === 'DELETE') {
              articles = articles.filter((item) => item !== article)
              return json({ ok: true })
            }
            if (req.method === 'PUT') Object.assign(article, payload)
            if (match[2])
              article.status = match[2] === 'publish' ? 'published' : 'draft'
            return json({ article })
          }
          return json({ error: 'Not found' }, 404)
        } catch (error) {
          return json({ error: error.message }, 500)
        }
      })
    },
  }
}
for (const [surface, port] of [
  ['public', 5175],
  ['admin', 5174],
]) {
  const server = await createServer({
    root,
    define: {
      'import.meta.env.VITE_SITE_SURFACE': JSON.stringify(surface),
      'import.meta.env.VITE_BLOG_RUNTIME_BASE_URL':
        JSON.stringify('/blog-runtime'),
      'import.meta.env.VITE_ADMIN_API_BASE_URL': JSON.stringify('/api'),
    },
    plugins: [fixturePlugin()],
    server: { host: '127.0.0.1', port, strictPort: true },
  })
  await server.listen()
  console.log(`${surface} isolated preview: http://127.0.0.1:${port}`)
}
