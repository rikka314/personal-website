import { useEffect, useMemo, useState } from 'react'
import { FileUp, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { importMarkdown, listArticles, listColumns } from './api'

export default function AdminDashboard({ copy, locale }) {
  const [articles, setArticles] = useState([])
  const [columns, setColumns] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [importState, setImportState] = useState({
    assets: [],
    markdown: null,
    status: 'draft',
  })
  const [importMessage, setImportMessage] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      setIsLoading(true)
      setError('')

      try {
        const [articlePayload, columnPayload] = await Promise.all([
          listArticles(),
          listColumns(),
        ])
        if (!cancelled) {
          setArticles(articlePayload.articles ?? [])
          setColumns(columnPayload.columns ?? [])
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError.message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    hydrate()

    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(
    () => ({
      drafts: articles.filter((article) => article.status === 'draft').length,
      published: articles.filter((article) => article.status === 'published')
        .length,
      columns: columns.length,
    }),
    [articles, columns],
  )

  const handleImport = async () => {
    if (!importState.markdown) {
      setImportMessage(
        locale === 'zh'
          ? '请先选择 Markdown 文件。'
          : 'Select a Markdown file first.',
      )
      return
    }

    setIsImporting(true)
    setImportMessage('')

    try {
      const payload = await importMarkdown(importState)
      setArticles((current) => [
        payload.article,
        ...current.filter((item) => item.id !== payload.article.id),
      ])
      setImportMessage(
        locale === 'zh'
          ? `已导入文章：${payload.article.title}`
          : `Imported article: ${payload.article.title}`,
      )
      setImportState({
        assets: [],
        markdown: null,
        status: 'draft',
      })
    } catch (nextError) {
      setImportMessage(nextError.message)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <section className="admin-stats">
            {[
              {
                label: copy.statDrafts,
                value: stats.drafts,
              },
              {
                label: copy.statPublished,
                value: stats.published,
              },
              {
                label: copy.statColumns,
                value: stats.columns,
              },
            ].map((item) => (
              <article key={item.label} className="admin-stat">
                <p className="tiny-label">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-text">
                  {item.value}
                </p>
              </article>
            ))}
          </section>

          <section className="panel p-7 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="tiny-label">{copy.articleList}</p>
                <h1 className="mt-2 text-2xl font-semibold text-text">
                  {copy.dashboardTitle}
                </h1>
              </div>

              <Link className="button-primary" to="/articles/new">
                <Plus size={15} aria-hidden="true" />
                {copy.newArticle}
              </Link>
            </div>

            {isLoading ? (
              <p className="mt-6 text-sm leading-7 text-muted">
                {copy.loading}
              </p>
            ) : error ? (
              <p role="alert" className="feedback feedback-error">
                {error}
              </p>
            ) : (
              <div className="mt-6 grid gap-4">
                {!articles.length && (
                  <p className="text-sm leading-7 text-muted">
                    {locale === 'zh'
                      ? '还没有文章。从一篇新草稿开始。'
                      : 'No articles yet. Start with a new draft.'}
                  </p>
                )}
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    className="admin-article-row"
                    to={`/articles/${article.id}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="tiny-label">
                          {article.status} / {article.language?.toUpperCase()} /{' '}
                          {article.type}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-text">
                          {article.title}
                        </p>
                      </div>
                      <span className="chip">{article.column}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {article.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="grid h-fit content-start gap-5">
          <section className="panel p-7 md:p-8">
            <p className="tiny-label">{copy.importLabel}</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">
              {copy.importTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              {copy.importBody}
            </p>

            <div className="mt-6 grid gap-4">
              <label className="blog-select-shell">
                <span>{copy.importMarkdown}</span>
                <input
                  accept=".md,.markdown,text/markdown"
                  onChange={(event) =>
                    setImportState((current) => ({
                      ...current,
                      markdown: event.target.files?.[0] ?? null,
                    }))
                  }
                  type="file"
                />
              </label>

              <label className="blog-select-shell">
                <span>{copy.importAssets}</span>
                <input
                  multiple
                  onChange={(event) =>
                    setImportState((current) => ({
                      ...current,
                      assets: Array.from(event.target.files ?? []),
                    }))
                  }
                  type="file"
                />
              </label>

              <label className="blog-select-shell">
                <span>{copy.importStatus}</span>
                <select
                  onChange={(event) =>
                    setImportState((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  value={importState.status}
                >
                  <option value="draft">{copy.saveDraft}</option>
                  <option value="published">{copy.publishNow}</option>
                </select>
              </label>

              <button
                className="button-primary"
                disabled={isImporting}
                onClick={handleImport}
                type="button"
              >
                <FileUp size={15} aria-hidden="true" />
                {isImporting ? copy.importing : copy.importAction}
              </button>

              {importMessage ? (
                <div
                  role="status"
                  className="soft-surface px-4 py-4 text-sm leading-7 text-muted"
                >
                  {importMessage}
                </div>
              ) : null}
            </div>
          </section>

          <section className="panel p-7 md:p-8">
            <p className="tiny-label">{copy.columnList}</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">
              {copy.columnsTitle}
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {columns.map((column) => (
                <span key={column.slug} className="chip">
                  {column.name?.[locale] ?? column.slug}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
