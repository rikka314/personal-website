import { useEffect, useMemo, useRef, useState } from 'react'
import { ImageUp, Plus, Save, Send, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MarkdownContent from '../components/MarkdownContent'
import { ARTICLE_TYPES, slugify } from '../lib/blog/runtime'
import {
  createArticle,
  createColumn,
  deleteArticle,
  getArticle,
  listColumns,
  publishArticle,
  unpublishArticle,
  updateArticle,
  uploadAsset,
} from './api'

function blankArticle() {
  return {
    id: '',
    slug: '',
    title: '',
    excerpt: '',
    contentMarkdown: '',
    language: 'en',
    type: 'note',
    column: '',
    tags: [],
    status: 'draft',
    coverImage: '',
    pinned: false,
    pinOrder: 999,
    publishedAt: '',
    createdAt: '',
    updatedAt: '',
    seoTitle: '',
    seoDescription: '',
    enableComments: true,
  }
}

function toDateTimeLocal(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function fromDateTimeLocal(value) {
  if (!value) {
    return ''
  }

  return new Date(value).toISOString()
}

function insertAround(textarea, before, after = '') {
  if (!textarea) {
    return ''
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = textarea.value.slice(start, end)
  return {
    cursor: start + before.length + selectedText.length + after.length,
    value:
      textarea.value.slice(0, start) +
      before +
      selectedText +
      after +
      textarea.value.slice(end),
  }
}

export default function AdminEditor({ copy, locale }) {
  const { articleId = 'new' } = useParams()
  const navigate = useNavigate()
  const textareaRef = useRef(null)
  const persistedIdRef = useRef(null)
  const [article, setArticle] = useState(blankArticle)
  const [tagsInput, setTagsInput] = useState('')
  const [columns, setColumns] = useState([])
  const [newColumnName, setNewColumnName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageKind, setMessageKind] = useState('success')
  const [editorView, setEditorView] = useState('edit')

  const isNewArticle = articleId === 'new'

  useEffect(() => {
    if (persistedIdRef.current === articleId) {
      persistedIdRef.current = null
      return
    }
    let cancelled = false

    async function hydrate() {
      setEditorView('edit')
      setIsLoading(true)
      setMessage('')
      setMessageKind('success')

      try {
        const columnPayload = await listColumns()
        if (!cancelled) {
          setColumns(columnPayload.columns ?? [])
        }

        if (isNewArticle) {
          if (!cancelled) {
            setArticle({
              ...blankArticle(),
              column: columnPayload.columns?.[0]?.slug ?? '',
            })
            setTagsInput('')
          }
          return
        }

        const articlePayload = await getArticle(articleId)
        if (!cancelled) {
          setArticle(articlePayload.article)
          setTagsInput((articlePayload.article.tags ?? []).join(', '))
        }
      } catch (nextError) {
        if (!cancelled) {
          setMessage(nextError.message)
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
  }, [articleId, isNewArticle])

  const columnOptions = useMemo(
    () =>
      columns.map((column) => ({
        slug: column.slug,
        label: column.name?.[locale] ?? column.slug,
      })),
    [columns, locale],
  )

  const applyMarkdownTransform = (before, after = '') => {
    const textarea = textareaRef.current
    const next = insertAround(textarea, before, after)
    if (!next) {
      return
    }

    setArticle((current) => ({
      ...current,
      contentMarkdown: next.value,
    }))

    requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(next.cursor, next.cursor)
    })
  }

  const ensurePersistedArticle = async () => {
    const payload = {
      ...article,
      tags: tagsInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      publishedAt: fromDateTimeLocal(article.publishedAt),
      seoTitle: article.seoTitle || article.title,
      seoDescription: article.seoDescription || article.excerpt,
      slug: article.slug || slugify(article.title, 'untitled-article'),
    }

    if (isNewArticle || !article.id) {
      const created = await createArticle(payload)
      setArticle(created.article)
      setTagsInput((created.article.tags ?? []).join(', '))
      persistedIdRef.current = created.article.id
      navigate(`/articles/${created.article.id}`, { replace: true })
      return created.article
    }

    const updated = await updateArticle(article.id, payload)
    setArticle(updated.article)
    setTagsInput((updated.article.tags ?? []).join(', '))
    return updated.article
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')
    setMessageKind('success')

    try {
      const savedArticle = await ensurePersistedArticle()
      setMessage(
        locale === 'zh'
          ? `已保存：${savedArticle.title}`
          : `Saved: ${savedArticle.title}`,
      )
    } catch (nextError) {
      setMessageKind('error')
      setMessage(nextError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    setIsSaving(true)
    setMessage('')
    setMessageKind('success')

    try {
      const savedArticle = await ensurePersistedArticle()
      const published = await publishArticle(savedArticle.id)
      setArticle(published.article)
      setMessage(locale === 'zh' ? '文章已发布。' : 'Article published.')
    } catch (nextError) {
      setMessageKind('error')
      setMessage(nextError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnpublish = async () => {
    if (!article.id) {
      return
    }

    setIsSaving(true)
    setMessage('')
    setMessageKind('success')

    try {
      const unpublished = await unpublishArticle(article.id)
      setArticle(unpublished.article)
      setMessage(
        locale === 'zh' ? '文章已撤回为草稿。' : 'Article moved back to draft.',
      )
    } catch (nextError) {
      setMessageKind('error')
      setMessage(nextError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!article.id) {
      navigate('/')
      return
    }

    if (
      !window.confirm(
        locale === 'zh' ? '确认删除这篇文章？' : 'Delete this article?',
      )
    ) {
      return
    }

    setIsSaving(true)
    setMessage('')
    setMessageKind('success')

    try {
      await deleteArticle(article.id)
      navigate('/')
    } catch (nextError) {
      setMessageKind('error')
      setMessage(nextError.message)
      setIsSaving(false)
    }
  }

  const handleAssetUpload = async (file) => {
    if (!file) {
      return
    }

    setIsSaving(true)
    setMessage('')
    setMessageKind('success')

    try {
      const currentArticle = article.id
        ? article
        : await ensurePersistedArticle()
      const uploaded = await uploadAsset({
        articleId: currentArticle.id,
        file,
      })
      applyMarkdownTransform(`\n\n![${file.name}](${uploaded.asset.url})\n\n`)
      setMessage(
        locale === 'zh'
          ? '图片已上传并插入正文。'
          : 'Image uploaded and inserted.',
      )
    } catch (nextError) {
      setMessageKind('error')
      setMessage(nextError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateColumn = async () => {
    if (!newColumnName.trim()) {
      return
    }

    try {
      const slug = slugify(newColumnName, 'new-column')
      const created = await createColumn({
        slug,
        name: {
          en: newColumnName,
          zh: newColumnName,
        },
      })
      setColumns((current) => [...current, created.column])
      setArticle((current) => ({
        ...current,
        column: created.column.slug,
      }))
      setNewColumnName('')
    } catch (nextError) {
      setMessageKind('error')
      setMessage(nextError.message)
    }
  }

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="panel p-8">
          <p className="tiny-label">{copy.editorTitle}</p>
          <p className="mt-3 text-sm leading-7 text-muted">{copy.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="editor-action-bar">
        <div>
          <p className="eyebrow">{copy.editorLabel}</p>
          <h1 className="text-lg font-semibold text-text">
            {copy.editorTitle}
          </h1>
        </div>

        <div className="editor-actions">
          <button
            className="button-secondary"
            disabled={isSaving}
            onClick={handleSave}
            type="button"
          >
            <Save size={15} aria-hidden="true" />
            {isSaving
              ? locale === 'zh'
                ? '处理中…'
                : 'Working…'
              : copy.saveDraft}
          </button>
          <button
            className="button-primary"
            disabled={isSaving}
            onClick={handlePublish}
            type="button"
          >
            <Send size={15} aria-hidden="true" />
            {copy.publishNow}
          </button>
          {article.status === 'published' ? (
            <button
              className="button-secondary"
              disabled={isSaving}
              onClick={handleUnpublish}
              type="button"
            >
              {copy.unpublish}
            </button>
          ) : null}
          <button
            className="button-secondary button-danger"
            disabled={isSaving}
            onClick={handleDelete}
            type="button"
          >
            <Trash2 size={15} aria-hidden="true" />
            {copy.delete}
          </button>
        </div>
      </div>

      {message ? (
        <div
          role={messageKind === 'error' ? 'alert' : 'status'}
          className={`feedback ${messageKind === 'error' ? 'feedback-error' : ''}`}
        >
          {message}
        </div>
      ) : null}

      <div className="mb-6">
        {' '}
        <label className="blog-select-shell">
          <span>{copy.title}</span>
          <input
            className="editor-title"
            onChange={(event) =>
              setArticle((current) => ({
                ...current,
                title: event.target.value,
                slug:
                  current.slug ||
                  slugify(event.target.value, 'untitled-article'),
              }))
            }
            type="text"
            value={article.title}
          />
        </label>
      </div>
      <details className="article-settings">
        <summary>{locale === 'zh' ? '文章设置' : 'Article settings'}</summary>
        <div className="settings-grid">
          <fieldset>
            <legend>
              {locale === 'zh' ? '基本信息' : 'Basic information'}
            </legend>

            <label className="blog-select-shell">
              <span>{copy.slug}</span>
              <input
                onChange={(event) =>
                  setArticle((current) => ({
                    ...current,
                    slug: slugify(event.target.value, 'untitled-article'),
                  }))
                }
                type="text"
                value={article.slug}
              />
            </label>

            <label className="blog-select-shell">
              <span>{copy.excerpt}</span>
              <textarea
                onChange={(event) =>
                  setArticle((current) => ({
                    ...current,
                    excerpt: event.target.value,
                  }))
                }
                rows={4}
                value={article.excerpt}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="blog-select-shell">
                <span>{copy.language}</span>
                <select
                  onChange={(event) =>
                    setArticle((current) => ({
                      ...current,
                      language: event.target.value,
                    }))
                  }
                  value={article.language}
                >
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                </select>
              </label>

              <label className="blog-select-shell">
                <span>{copy.type}</span>
                <select
                  onChange={(event) =>
                    setArticle((current) => ({
                      ...current,
                      type: event.target.value,
                    }))
                  }
                  value={article.type}
                >
                  {ARTICLE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label[locale]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="blog-select-shell">
              <span>{copy.column}</span>
              <select
                onChange={(event) =>
                  setArticle((current) => ({
                    ...current,
                    column: event.target.value,
                  }))
                }
                value={article.column}
              >
                {columnOptions.map((column) => (
                  <option key={column.slug} value={column.slug}>
                    {column.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-3">
              <input
                className="form-input flex-1"
                aria-label={copy.newColumnPlaceholder}
                onChange={(event) => setNewColumnName(event.target.value)}
                placeholder={copy.newColumnPlaceholder}
                type="text"
                value={newColumnName}
              />
              <button
                className="button-secondary"
                onClick={handleCreateColumn}
                type="button"
              >
                <Plus size={15} aria-hidden="true" />
                {copy.addColumn}
              </button>
            </div>

            <label className="blog-select-shell">
              <span>{copy.tags}</span>
              <input
                onChange={(event) => setTagsInput(event.target.value)}
                type="text"
                value={tagsInput}
              />
            </label>
          </fieldset>
          <fieldset>
            <legend>{locale === 'zh' ? '发布设置' : 'Publishing'}</legend>{' '}
            <label className="blog-select-shell">
              <span>{copy.coverImage}</span>
              <input
                onChange={(event) =>
                  setArticle((current) => ({
                    ...current,
                    coverImage: event.target.value,
                  }))
                }
                type="text"
                value={article.coverImage || ''}
              />
            </label>
            <label className="blog-select-shell">
              <span>{copy.publishDate}</span>
              <input
                onChange={(event) =>
                  setArticle((current) => ({
                    ...current,
                    publishedAt: event.target.value,
                  }))
                }
                type="datetime-local"
                value={toDateTimeLocal(article.publishedAt)}
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="blog-toggle">
                <input
                  checked={article.pinned}
                  onChange={(event) =>
                    setArticle((current) => ({
                      ...current,
                      pinned: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span>{copy.pinned}</span>
              </label>

              <label className="blog-select-shell">
                <span>{copy.pinOrder}</span>
                <input
                  min="1"
                  onChange={(event) =>
                    setArticle((current) => ({
                      ...current,
                      pinOrder: Number(event.target.value) || 999,
                    }))
                  }
                  type="number"
                  value={article.pinOrder}
                />
              </label>
            </div>
            <label className="blog-toggle">
              <input
                checked={article.enableComments}
                onChange={(event) =>
                  setArticle((current) => ({
                    ...current,
                    enableComments: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>{copy.enableComments}</span>
            </label>
          </fieldset>
          <fieldset>
            <legend>SEO</legend>{' '}
            <label className="blog-select-shell">
              <span>{copy.seoTitle}</span>
              <input
                onChange={(event) =>
                  setArticle((current) => ({
                    ...current,
                    seoTitle: event.target.value,
                  }))
                }
                type="text"
                value={article.seoTitle}
              />
            </label>
            <label className="blog-select-shell">
              <span>{copy.seoDescription}</span>
              <textarea
                onChange={(event) =>
                  setArticle((current) => ({
                    ...current,
                    seoDescription: event.target.value,
                  }))
                }
                rows={4}
                value={article.seoDescription}
              />
            </label>
          </fieldset>
        </div>
      </details>
      <div
        className="editor-tabs"
        role="tablist"
        aria-label={locale === 'zh' ? '写作视图' : 'Writing view'}
      >
        {['edit', 'preview'].map((view) => (
          <button
            key={view}
            className="editor-tab"
            type="button"
            role="tab"
            aria-selected={editorView === view}
            aria-controls={`editor-${view}-panel`}
            tabIndex={editorView === view ? 0 : -1}
            onClick={() => setEditorView(view)}
            onKeyDown={(event) => {
              if (
                ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
              ) {
                event.preventDefault()
                const next =
                  event.key === 'Home'
                    ? 'edit'
                    : event.key === 'End'
                      ? 'preview'
                      : editorView === 'edit'
                        ? 'preview'
                        : 'edit'
                setEditorView(next)
                event.currentTarget.parentElement.children[
                  next === 'edit' ? 0 : 1
                ].focus()
              }
            }}
          >
            {view === 'edit'
              ? locale === 'zh'
                ? '编辑'
                : 'Edit'
              : copy.previewLabel}
          </button>
        ))}
      </div>
      <section className="editor-workspace" data-view={editorView}>
        <div
          className="editor-pane"
          id="editor-edit-panel"
          role="region"
          aria-label={locale === 'zh' ? 'Markdown 编辑' : 'Markdown editor'}
        >
          <div className="editor-toolbar">
            <button
              className="button-secondary"
              onClick={() => applyMarkdownTransform('## ')}
              type="button"
            >
              H2
            </button>
            <button
              className="button-secondary"
              onClick={() => applyMarkdownTransform('**', '**')}
              type="button"
            >
              Bold
            </button>
            <button
              className="button-secondary"
              onClick={() => applyMarkdownTransform('`', '`')}
              type="button"
            >
              Code
            </button>
            <button
              className="button-secondary"
              onClick={() => applyMarkdownTransform('\n```python\n', '\n```\n')}
              type="button"
            >
              Code block
            </button>
            <button
              className="button-secondary"
              onClick={() => applyMarkdownTransform('$$\n', '\n$$')}
              type="button"
            >
              LaTeX
            </button>
            <label className="button-secondary">
              <ImageUp size={15} aria-hidden="true" />
              {copy.uploadImage}
              <input
                className="sr-only"
                aria-label={copy.uploadImage}
                disabled={isSaving}
                onChange={(event) =>
                  handleAssetUpload(event.target.files?.[0] ?? null)
                }
                type="file"
              />
            </label>
          </div>

          <textarea
            aria-label={
              locale === 'zh'
                ? '文章正文（Markdown）'
                : 'Article body (Markdown)'
            }
            ref={textareaRef}
            className="admin-editor-area mt-5"
            onChange={(event) =>
              setArticle((current) => ({
                ...current,
                contentMarkdown: event.target.value,
              }))
            }
            value={article.contentMarkdown}
          />
        </div>

        <div
          className="preview-pane"
          id="editor-preview-panel"
          role="region"
          aria-label={copy.previewLabel}
        >
          <div className="preview-heading">
            <div>
              <p className="tiny-label">{copy.previewLabel}</p>
              <h3 className="mt-2 text-2xl font-semibold text-text">
                {article.title || copy.previewTitle}
              </h3>
            </div>
            <Link className="blog-inline-link" to="/">
              {copy.backToDashboard}
            </Link>
          </div>

          <div className="mt-6">
            <MarkdownContent
              markdown={article.contentMarkdown || copy.previewEmpty}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
