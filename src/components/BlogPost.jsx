import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  ChevronDown,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import GiscusComments from './GiscusComments'
import MarkdownContent from './MarkdownContent'
import { useLocale } from '../context/useLocale'
import { loadBlogArticle } from '../lib/blog/client'
import { formatBlogDate } from '../lib/blog/runtime'

export default function BlogPost() {
  const { slug = '' } = useParams()
  const { locale } = useLocale()
  const [post, setPost] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)

  const copy =
    locale === 'zh'
      ? {
          article: '文章',
          back: '返回博客',
          comments: '评论',
          loadingBody: '正在加载文章内容与目录。',
          loadingLabel: '加载中',
          missingBody:
            '没有找到对应的运行时文章数据，请检查发布后的文章 JSON 是否存在。',
          missingLabel: '文章不可用',
          missingTitle: '这篇文章暂时无法加载。',
          next: '下一篇',
          previous: '上一篇',
          tableOfContents: '目录',
        }
      : {
          article: 'Article',
          back: 'Back to blog',
          comments: 'Comments',
          loadingBody: 'Loading the article content and table of contents.',
          loadingLabel: 'Loading',
          missingBody:
            'The runtime article payload was not found. Check whether the published article JSON exists.',
          missingLabel: 'Article unavailable',
          missingTitle: 'This post could not be loaded.',
          next: 'Next',
          previous: 'Previous',
          tableOfContents: 'Table of contents',
        }

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      setIsLoading(true)
      setHasError(false)

      try {
        const article = await loadBlogArticle(slug)
        if (!cancelled) {
          if (!article) {
            setHasError(true)
          } else {
            setPost(article)
          }
        }
      } catch {
        if (!cancelled) {
          setHasError(true)
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
  }, [slug])

  useEffect(() => {
    if (!post) {
      return
    }

    const previousTitle = document.title
    const descriptionTag = document.querySelector('meta[name="description"]')
    const previousDescription = descriptionTag?.getAttribute('content') ?? ''

    document.title = `${post.seoTitle} | Steve Huang`
    descriptionTag?.setAttribute('content', post.seoDescription || post.excerpt)

    return () => {
      document.title = previousTitle
      descriptionTag?.setAttribute('content', previousDescription)
    }
  }, [post])

  const columnLabel = useMemo(
    () => post?.columnInfo?.name?.[locale] ?? post?.column ?? '',
    [locale, post],
  )

  if (isLoading) {
    return (
      <section className="section-shell">
        <div className="page-shell">
          <div className="panel p-8">
            <p className="tiny-label">{copy.loadingLabel}</p>
            <p className="mt-3 text-base leading-7 text-muted">
              {copy.loadingBody}
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (hasError || !post) {
    return (
      <section className="section-shell">
        <div className="page-shell">
          <div className="panel p-8">
            <p className="tiny-label">{copy.missingLabel}</p>
            <h1 className="mt-3 text-3xl font-semibold text-text">
              {copy.missingTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              {copy.missingBody}
            </p>
            <Link className="button-secondary mt-6" to="/blog" viewTransition>
              <ArrowLeft size={16} aria-hidden="true" />
              {copy.back}
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-shell">
      <div className="page-shell">
        <div className="article-layout">
          <div className="article-main">
            <Link className="button-secondary" to="/blog" viewTransition>
              <ArrowLeft size={16} aria-hidden="true" />
              {copy.back}
            </Link>

            <header className="article-heading">
              <p className="eyebrow">{copy.article}</p>
              <h1 className="mt-3 text-4xl leading-tight text-text md:text-5xl">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
                  {post.excerpt}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={15} aria-hidden="true" />
                  {formatBlogDate(post.publishedAt, locale)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 size={15} aria-hidden="true" />
                  {post.readingTime}
                </span>
                <span className="chip chip-ghost">{post.languageLabel}</span>
                <span className="chip chip-ghost">
                  {post.typeLabels[locale]}
                </span>
                <Link
                  className="blog-inline-link"
                  to={`/blog/columns/${post.column}`}
                  viewTransition
                >
                  {columnLabel}
                </Link>
              </div>

              {post.tags?.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </header>

            {post.coverImage ? (
              <div className="panel mt-6 overflow-hidden">
                <img
                  alt={post.title}
                  className="blog-cover-image"
                  src={post.coverImage}
                />
              </div>
            ) : null}

            <article className="article-body">
              <MarkdownContent
                markdown={post.contentMarkdown}
                headings={post.toc}
              />
            </article>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {post.previous ? (
                <Link
                  className="panel panel-hover flex items-center justify-between gap-4 p-5"
                  to={`/blog/${post.previous.slug}`}
                  viewTransition
                >
                  <div>
                    <p className="tiny-label">{copy.previous}</p>
                    <p className="mt-2 text-base font-semibold text-text">
                      {post.previous.title}
                    </p>
                  </div>
                  <ArrowLeft size={16} aria-hidden="true" />
                </Link>
              ) : null}

              {post.next ? (
                <Link
                  className="panel panel-hover flex items-center justify-between gap-4 p-5"
                  to={`/blog/${post.next.slug}`}
                  viewTransition
                >
                  <div>
                    <p className="tiny-label">{copy.next}</p>
                    <p className="mt-2 text-base font-semibold text-text">
                      {post.next.title}
                    </p>
                  </div>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : null}
            </div>

            {post.enableComments ? (
              <section className="panel mt-6 p-7 md:p-8">
                <p className="tiny-label">{copy.comments}</p>
                <h2 className="mt-3 text-2xl font-semibold text-text">
                  {copy.comments}
                </h2>
                <div className="mt-6">
                  <GiscusComments term={post.slug} />
                </div>
              </section>
            ) : null}
          </div>

          <aside className="article-toc">
            <p className="tiny-label toc-label">{copy.tableOfContents}</p>
            <button
              type="button"
              className="toc-toggle"
              aria-expanded={tocOpen}
              aria-controls="article-toc-content"
              onClick={() => setTocOpen((open) => !open)}
            >
              {copy.tableOfContents}
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            <div
              id="article-toc-content"
              className="toc-content"
              data-open={tocOpen}
            >
              {post.toc?.length ? (
                <nav className="mt-4 space-y-2">
                  {post.toc.map((item) => (
                    <a
                      key={item.id}
                      className={`blog-toc-link ${item.level === 3 ? 'blog-toc-link-nested' : ''}`}
                      href={`#${item.id}`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              ) : (
                <p className="mt-4 text-sm leading-7 text-muted">
                  {locale === 'zh'
                    ? '这篇文章目前没有可导航的小节。'
                    : 'This article does not currently expose navigable headings.'}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
