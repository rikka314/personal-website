import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Search,
  ChevronDown,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLocale } from '../context/useLocale'
import { loadBlogIndex, loadBlogSearch } from '../lib/blog/client'
import { ADMIN_PATH_PREFIX } from '../lib/site'
import {
  ARTICLE_TYPES,
  BLOG_LANGUAGES,
  BLOG_PAGE_SIZE,
  formatBlogDate,
} from '../lib/blog/runtime'

const defaults = {
  q: '',
  type: 'all',
  language: 'all',
  column: 'all',
  tag: 'all',
  page: 1,
}

function patchSearchParams(setSearchParams, values) {
  setSearchParams((current) => {
    const next = new URLSearchParams(current)

    for (const [key, value] of Object.entries(values)) {
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        value === 'all' ||
        (key === 'page' && Number(value) <= 1)
      ) {
        next.delete(key)
      } else {
        next.set(key, `${value}`)
      }
    }

    return next
  })
}

function BlogCard({ article, copy, locale }) {
  return (
    <article className="blog-entry">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          <CalendarDays size={15} aria-hidden="true" />
          {formatBlogDate(article.publishedAt, locale)}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock3 size={15} aria-hidden="true" />
          {article.readingTime}
        </span>
        <span className="chip chip-ghost">{article.languageLabel}</span>
        <span className="chip chip-ghost">{article.typeLabels[locale]}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          className="blog-inline-link"
          to={`/blog/columns/${article.column}`}
          viewTransition
        >
          {article.columnInfo?.name?.[locale] ?? article.column}
        </Link>
        {article.pinned ? (
          <span className="chip">{copy.pinnedLabel}</span>
        ) : null}
      </div>

      <h3 className="mt-4">
        <Link to={`/blog/${article.slug}`}>{article.title}</Link>
      </h3>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
        {article.excerpt}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {article.tags.map((tag) => (
          <span key={tag} className="chip">
            {tag}
          </span>
        ))}
      </div>

      <Link
        className="text-link mt-4"
        to={`/blog/${article.slug}`}
        viewTransition
      >
        {copy.readArticle}
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </article>
  )
}

function Pager({ currentPage, locale, onChange, pageCount }) {
  if (pageCount <= 1) {
    return null
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted">
        {locale === 'zh'
          ? `第 ${currentPage} / ${pageCount} 页`
          : `Page ${currentPage} of ${pageCount}`}
      </p>
      <div className="flex gap-3">
        <button
          className="button-secondary"
          disabled={currentPage <= 1}
          onClick={() => onChange(currentPage - 1)}
          type="button"
        >
          {locale === 'zh' ? '上一页' : 'Previous'}
        </button>
        <button
          className="button-secondary"
          disabled={currentPage >= pageCount}
          onClick={() => onChange(currentPage + 1)}
          type="button"
        >
          {locale === 'zh' ? '下一页' : 'Next'}
        </button>
      </div>
    </div>
  )
}

export default function BlogHub({ forcedColumnSlug = '' }) {
  const { locale } = useLocale()
  const [searchParams, setSearchParams] = useSearchParams()
  const [index, setIndex] = useState(null)
  const [searchIndex, setSearchIndex] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const query = searchParams.get('q') ?? defaults.q
  const deferredQuery = useDeferredValue(query.trim())
  const selectedType = searchParams.get('type') ?? defaults.type
  const selectedLanguage = searchParams.get('language') ?? defaults.language
  const selectedColumn =
    forcedColumnSlug || searchParams.get('column') || defaults.column
  const selectedTag = searchParams.get('tag') ?? defaults.tag
  const rawPage = Number(searchParams.get('page') ?? defaults.page)
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1

  const copy =
    locale === 'zh'
      ? {
          allColumns: '全部专栏',
          allLanguages: '全部语言',
          allTags: '全部标签',
          allTypes: '全部类型',
          clearFilters: '清空筛选',
          emptyBody: '当前筛选和搜索条件下没有找到匹配文章。',
          emptyTitle: '没有找到匹配内容',
          featuredBody: '置顶文章会先展示，默认列表不会重复这些内容。',
          featuredTitle: '置顶文章',
          matchingProjects: '项目命中',
          pinnedLabel: '置顶',
          queryPlaceholder: '搜索文章和项目',
          readArticle: '阅读全文',
          resultSummary: '博客档案',
          sectionCopy:
            '这里长期记录技术、科研和学习内容，支持搜索、筛选、专栏和分页浏览。',
          sectionEyebrow: forcedColumnSlug ? '专栏' : '博客',
          sectionTitle: forcedColumnSlug
            ? '专栏内容'
            : '一个长期维护的技术与学习档案。',
          searchHint: '搜索范围覆盖博客文章与项目内容。',
          searchLabel: '搜索',
        }
      : {
          allColumns: 'All columns',
          allLanguages: 'All languages',
          allTags: 'All tags',
          allTypes: 'All types',
          clearFilters: 'Clear filters',
          emptyBody: 'No article matched the current query and filters.',
          emptyTitle: 'No matching results',
          featuredBody:
            'Pinned articles stay at the top and are not repeated in the default list.',
          featuredTitle: 'Pinned writing',
          matchingProjects: 'Project matches',
          pinnedLabel: 'Pinned',
          queryPlaceholder: 'Search posts and projects',
          readArticle: 'Read article',
          resultSummary: 'Archive',
          sectionCopy:
            'This archive keeps technical notes, research preparation, and learning logs in one searchable stream.',
          sectionEyebrow: forcedColumnSlug ? 'Column' : 'Blog',
          sectionTitle: forcedColumnSlug
            ? 'Writing collected inside one column.'
            : 'A long-term archive for technical, research, and learning notes.',
          searchHint: 'Search covers published blog posts and project records.',
          searchLabel: 'Search',
        }

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      setIsLoading(true)
      setHasError(false)

      try {
        const [nextIndex, nextSearch] = await Promise.all([
          loadBlogIndex(),
          loadBlogSearch(),
        ])
        if (!cancelled) {
          setIndex(nextIndex)
          setSearchIndex(nextSearch)
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
  }, [])

  const columnRecord = useMemo(
    () =>
      index?.taxonomies.columns.find(
        (item) => item.slug === forcedColumnSlug,
      ) ?? null,
    [forcedColumnSlug, index?.taxonomies.columns],
  )

  const derivedState = useMemo(() => {
    if (!index || !searchIndex) {
      return null
    }

    const normalizedQuery = deferredQuery.toLowerCase()
    const articleMatches = normalizedQuery
      ? new Set(
          searchIndex.entries
            .filter(
              (entry) =>
                entry.kind === 'article' &&
                entry.searchText.includes(normalizedQuery),
            )
            .map((entry) => entry.slug),
        )
      : null
    const projectMatches = normalizedQuery
      ? searchIndex.entries.filter(
          (entry) =>
            entry.kind === 'project' &&
            entry.searchText.includes(normalizedQuery),
        )
      : []
    const hasFilters =
      Boolean(normalizedQuery) ||
      selectedType !== 'all' ||
      selectedLanguage !== 'all' ||
      selectedColumn !== 'all' ||
      selectedTag !== 'all'

    const filteredArticles = index.articles.filter((article) => {
      if (selectedType !== 'all' && article.type !== selectedType) return false
      if (selectedLanguage !== 'all' && article.language !== selectedLanguage)
        return false
      if (selectedColumn !== 'all' && article.column !== selectedColumn)
        return false
      if (selectedTag !== 'all' && !article.tags.includes(selectedTag))
        return false
      if (articleMatches && !articleMatches.has(article.slug)) return false
      return true
    })

    const featuredSlugs = new Set(index.featured.map((article) => article.slug))
    const listArticles =
      hasFilters || forcedColumnSlug
        ? filteredArticles
        : filteredArticles.filter((article) => !featuredSlugs.has(article.slug))
    const pageCount = Math.max(
      1,
      Math.ceil(listArticles.length / (index.pageSize || BLOG_PAGE_SIZE)),
    )
    const safePage = Math.min(currentPage, pageCount)
    const pageSize = index.pageSize || BLOG_PAGE_SIZE

    return {
      featured: hasFilters || forcedColumnSlug ? [] : index.featured,
      hasFilters,
      pageCount,
      projectMatches,
      safePage,
      total: listArticles.length,
      visibleArticles: listArticles.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize,
      ),
    }
  }, [
    currentPage,
    deferredQuery,
    forcedColumnSlug,
    index,
    searchIndex,
    selectedColumn,
    selectedLanguage,
    selectedTag,
    selectedType,
  ])

  useEffect(() => {
    if (derivedState && derivedState.safePage !== currentPage) {
      startTransition(() => {
        patchSearchParams(setSearchParams, { page: derivedState.safePage })
      })
    }
  }, [currentPage, derivedState, setSearchParams])

  if (isLoading) {
    return (
      <section className="section-shell blog-page">
        <div className="page-shell">
          <div className="panel p-8">
            <p className="tiny-label">{copy.searchLabel}</p>
            <p className="mt-3 text-base leading-7 text-muted">
              {locale === 'zh'
                ? '正在加载博客索引、搜索数据和分类信息。'
                : 'Loading the archive index, search data, and taxonomy metadata.'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (hasError || !index || !searchIndex || !derivedState) {
    return (
      <section className="section-shell blog-page">
        <div className="page-shell">
          <div className="panel p-8">
            <p className="tiny-label">{copy.searchLabel}</p>
            <h2 className="mt-3 text-3xl font-semibold text-text">
              {locale === 'zh'
                ? '博客内容暂时不可用。'
                : 'The archive is temporarily unavailable.'}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              {locale === 'zh'
                ? '没有成功加载博客运行时 JSON，请先确认运行时数据已经生成并发布。'
                : 'The blog runtime JSON could not be loaded. Confirm that the runtime data has been generated and published.'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-shell blog-page">
      <div className="page-shell">
        <div className="section-header">
          <p className="eyebrow">{copy.sectionEyebrow}</p>
          <h1 className="page-title">
            {columnRecord
              ? columnRecord.name[locale]
              : locale === 'zh'
                ? '写作与笔记'
                : 'Notes & writing.'}
          </h1>
          {!columnRecord && (
            <p className="mt-6 text-lg text-muted">{copy.sectionTitle}</p>
          )}
          <p className="section-copy">
            {columnRecord ? columnRecord.description[locale] : copy.sectionCopy}
          </p>
        </div>

        <div className="blog-layout">
          <div className="blog-filters">
            <div className="search-field">
              <Search size={20} aria-hidden="true" />
              <input
                className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
                onChange={(event) =>
                  patchSearchParams(setSearchParams, {
                    page: 1,
                    q: event.target.value,
                  })
                }
                placeholder={copy.queryPlaceholder}
                aria-label={copy.searchLabel}
                type="search"
                value={query}
              />
            </div>

            <button
              className="filter-toggle"
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="blog-filter-content"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {locale === 'zh' ? '筛选文章' : 'Filter articles'}
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            <div
              id="blog-filter-content"
              className="filter-content"
              data-open={filtersOpen}
            >
              <div className="filter-fields">
                <label className="blog-select-shell">
                  <span>{copy.allTypes}</span>
                  <select
                    onChange={(event) =>
                      patchSearchParams(setSearchParams, {
                        page: 1,
                        type: event.target.value,
                      })
                    }
                    value={selectedType}
                  >
                    <option value="all">{copy.allTypes}</option>
                    {ARTICLE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label[locale]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="blog-select-shell">
                  <span>{copy.allLanguages}</span>
                  <select
                    onChange={(event) =>
                      patchSearchParams(setSearchParams, {
                        language: event.target.value,
                        page: 1,
                      })
                    }
                    value={selectedLanguage}
                  >
                    <option value="all">{copy.allLanguages}</option>
                    {BLOG_LANGUAGES.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.label[locale]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="blog-select-shell">
                  <span>{copy.allColumns}</span>
                  <select
                    disabled={Boolean(forcedColumnSlug)}
                    onChange={(event) =>
                      patchSearchParams(setSearchParams, {
                        column: event.target.value,
                        page: 1,
                      })
                    }
                    value={selectedColumn}
                  >
                    <option value="all">{copy.allColumns}</option>
                    {index.taxonomies.columns.map((column) => (
                      <option key={column.slug} value={column.slug}>
                        {column.name[locale]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="blog-select-shell">
                  <span>{copy.allTags}</span>
                  <select
                    onChange={(event) =>
                      patchSearchParams(setSearchParams, {
                        page: 1,
                        tag: event.target.value,
                      })
                    }
                    value={selectedTag}
                  >
                    <option value="all">{copy.allTags}</option>
                    {index.taxonomies.tags.map((tag) => (
                      <option key={tag.slug} value={tag.label}>
                        {tag.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="filter-actions">
                <button
                  className="text-link"
                  onClick={() =>
                    patchSearchParams(setSearchParams, {
                      ...defaults,
                      column: forcedColumnSlug || 'all',
                    })
                  }
                  type="button"
                >
                  {copy.clearFilters}
                </button>

                <a className="text-link" href={`${ADMIN_PATH_PREFIX}/`}>
                  {locale === 'zh' ? '打开写作后台' : 'Open writing surface'}
                </a>
              </div>
            </div>
          </div>
          <div className="grid gap-5">
            {derivedState.featured.length ? (
              <section className="blog-group">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="tiny-label">{copy.resultSummary}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-text">
                      {copy.featuredTitle}
                    </h2>
                  </div>
                  <span className="chip">{derivedState.featured.length}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted">
                  {copy.featuredBody}
                </p>
                <div className="mt-6 grid gap-5">
                  {derivedState.featured.map((article) => (
                    <BlogCard
                      key={article.slug}
                      article={article}
                      copy={copy}
                      locale={locale}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {deferredQuery ? (
              <section className="blog-group">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="tiny-label">{copy.searchLabel}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-text">
                      {copy.matchingProjects}
                    </h2>
                  </div>
                  <span className="chip">
                    {derivedState.projectMatches.length}
                  </span>
                </div>
                <div className="mt-6 grid gap-4">
                  {derivedState.projectMatches.length ? (
                    derivedState.projectMatches.map((entry) => (
                      <a
                        key={entry.id}
                        className="admin-article-row"
                        href={entry.url}
                        rel={
                          entry.url.startsWith('http')
                            ? 'noreferrer'
                            : undefined
                        }
                        target={
                          entry.url.startsWith('http') ? '_blank' : undefined
                        }
                      >
                        <p className="tiny-label">
                          {entry.translations[locale].meta}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-text">
                          {entry.translations[locale].title}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-muted">
                          {entry.translations[locale].excerpt}
                        </p>
                      </a>
                    ))
                  ) : (
                    <p className="text-sm leading-7 text-muted">
                      {locale === 'zh'
                        ? '当前搜索没有命中项目内容。'
                        : 'The current query did not match any project records.'}
                    </p>
                  )}
                </div>
              </section>
            ) : null}

            <section className="blog-group">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="tiny-label">{copy.resultSummary}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-text">
                    {locale === 'zh'
                      ? `共 ${derivedState.total} 篇文章`
                      : `${derivedState.total} published posts`}
                  </h2>
                </div>
                <p className="max-w-lg text-sm leading-7 text-muted">
                  {copy.searchHint}
                </p>
              </div>

              <div className="mt-6 grid gap-5">
                {derivedState.visibleArticles.length ? (
                  derivedState.visibleArticles.map((article) => (
                    <BlogCard
                      key={article.slug}
                      article={article}
                      copy={copy}
                      locale={locale}
                    />
                  ))
                ) : (
                  <div className="soft-surface px-5 py-6">
                    <p className="text-lg font-semibold text-text">
                      {copy.emptyTitle}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {copy.emptyBody}
                    </p>
                  </div>
                )}
              </div>

              <Pager
                currentPage={derivedState.safePage}
                locale={locale}
                onChange={(page) =>
                  patchSearchParams(setSearchParams, { page })
                }
                pageCount={derivedState.pageCount}
              />
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}
