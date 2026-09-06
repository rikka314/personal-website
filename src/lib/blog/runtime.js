export const BLOG_PAGE_SIZE = 10

export const ARTICLE_TYPES = [
  {
    value: 'project-review',
    label: {
      en: 'Project review',
      zh: '项目复盘',
    },
  },
  {
    value: 'tutorial',
    label: {
      en: 'Tutorial',
      zh: '教程',
    },
  },
  {
    value: 'log',
    label: {
      en: 'Log',
      zh: '日志',
    },
  },
  {
    value: 'note',
    label: {
      en: 'Note',
      zh: '笔记',
    },
  },
  {
    value: 'essay',
    label: {
      en: 'Essay',
      zh: '随笔',
    },
  },
]

export const BLOG_LANGUAGES = [
  {
    value: 'en',
    label: {
      en: 'English',
      zh: '英文',
    },
    shortLabel: 'EN',
  },
  {
    value: 'zh',
    label: {
      en: 'Chinese',
      zh: '中文',
    },
    shortLabel: '中文',
  },
]

function normalizeDate(value) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

function cleanInlineMarkdown(value = '') {
  return value
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function stripMarkdown(markdown = '') {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>-]/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function slugify(value = '', fallback = 'item') {
  const normalized = `${value}`
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || fallback
}

export function formatBlogDate(date, locale = 'en') {
  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: locale === 'zh' ? 'long' : 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function getLanguageMeta(language = 'en') {
  return BLOG_LANGUAGES.find((item) => item.value === language) ?? BLOG_LANGUAGES[0]
}

export function getTypeMeta(type = 'note') {
  return ARTICLE_TYPES.find((item) => item.value === type) ?? ARTICLE_TYPES[3]
}

export function estimateReadingTime(markdown = '', language = 'en') {
  const plainText = stripMarkdown(markdown)
  const cjkCharacters = (plainText.match(/[\u3400-\u9fff]/g) ?? []).length
  const latinWords = plainText
    .replace(/[\u3400-\u9fff]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length

  const minutes = Math.max(1, Math.ceil(cjkCharacters / 300 + latinWords / 220))
  return language === 'zh' ? `${minutes} 分钟` : `${minutes} min`
}

export function extractHeadings(markdown = '') {
  const lines = markdown.split(/\r?\n/)
  const slugCounts = new Map()
  const headings = []
  let inCodeBlock = false

  for (const line of lines) {
    if (/^(```|~~~)/.test(line.trim())) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) {
      continue
    }

    const match = /^(#{2,3})\s+(.+)$/.exec(line)
    if (!match) {
      continue
    }

    const text = cleanInlineMarkdown(match[2])
    if (!text) {
      continue
    }

    const baseId = slugify(text, 'section')
    const seenCount = slugCounts.get(baseId) ?? 0
    slugCounts.set(baseId, seenCount + 1)

    headings.push({
      id: seenCount === 0 ? baseId : `${baseId}-${seenCount + 1}`,
      level: match[1].length,
      text,
    })
  }

  return headings
}

function buildTagSummary(tags = []) {
  const tagCountMap = new Map()

  for (const tag of tags) {
    const key = `${tag}`.trim()
    if (!key) {
      continue
    }

    const existing = tagCountMap.get(key) ?? 0
    tagCountMap.set(key, existing + 1)
  }

  return [...tagCountMap.entries()]
    .map(([label, count]) => ({
      slug: slugify(label, `tag-${count}`),
      label,
      count,
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

function sortByPublishDate(left, right) {
  const leftTime = new Date(left.publishedAt || left.updatedAt || left.createdAt || 0).getTime()
  const rightTime = new Date(right.publishedAt || right.updatedAt || right.createdAt || 0).getTime()
  return rightTime - leftTime
}

function sortFeatured(left, right) {
  if (left.pinOrder !== right.pinOrder) {
    return left.pinOrder - right.pinOrder
  }

  return sortByPublishDate(left, right)
}

function summarizeArticle(article, columnMap) {
  const column = columnMap.get(article.column) ?? null
  const readingTime = estimateReadingTime(article.contentMarkdown, article.language)
  const typeMeta = getTypeMeta(article.type)
  const languageMeta = getLanguageMeta(article.language)

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    language: article.language,
    languageLabel: languageMeta.shortLabel,
    type: article.type,
    typeLabels: typeMeta.label,
    column: article.column,
    columnInfo: column,
    tags: article.tags ?? [],
    coverImage: article.coverImage || null,
    pinned: Boolean(article.pinned),
    pinOrder: Number(article.pinOrder) || 999,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    publishedAt: article.publishedAt,
    readingTime,
  }
}

function normalizeColumn(column) {
  return {
    slug: column.slug,
    name: {
      en: column.name?.en ?? column.slug,
      zh: column.name?.zh ?? column.name?.en ?? column.slug,
    },
    description: {
      en: column.description?.en ?? '',
      zh: column.description?.zh ?? column.description?.en ?? '',
    },
  }
}

function normalizeArticle(article) {
  return {
    ...article,
    contentMarkdown: article.contentMarkdown ?? '',
    tags: Array.isArray(article.tags) ? article.tags.filter(Boolean) : [],
    language: article.language === 'zh' ? 'zh' : 'en',
    type: getTypeMeta(article.type).value,
    status: article.status === 'draft' ? 'draft' : 'published',
    pinned: Boolean(article.pinned),
    pinOrder: Number(article.pinOrder) || 999,
    createdAt: normalizeDate(article.createdAt) || normalizeDate(article.publishedAt) || new Date().toISOString(),
    updatedAt: normalizeDate(article.updatedAt) || normalizeDate(article.publishedAt) || new Date().toISOString(),
    publishedAt: normalizeDate(article.publishedAt),
    enableComments: article.enableComments !== false,
  }
}

function buildColumnSummary(columns, publishedArticles) {
  const columnCounts = new Map()

  for (const article of publishedArticles) {
    const existing = columnCounts.get(article.column) ?? 0
    columnCounts.set(article.column, existing + 1)
  }

  return columns
    .map((column) => ({
      ...column,
      count: columnCounts.get(column.slug) ?? 0,
    }))
    .filter((column) => column.count > 0)
}

function buildTypeSummary(articles) {
  return ARTICLE_TYPES.map((type) => ({
    ...type,
    count: articles.filter((article) => article.type === type.value).length,
  })).filter((type) => type.count > 0)
}

function buildLanguageSummary(articles) {
  return BLOG_LANGUAGES.map((language) => ({
    ...language,
    count: articles.filter((article) => article.language === language.value).length,
  })).filter((language) => language.count > 0)
}

function buildArticleSearchEntry(article) {
  const searchText = stripMarkdown(
    [
      article.title,
      article.excerpt,
      article.contentMarkdown,
      article.tags.join(' '),
      article.column,
    ].join(' '),
  ).toLowerCase()

  return {
    id: article.id,
    kind: 'article',
    slug: article.slug,
    searchText,
  }
}

export function buildBlogRuntime({ articles = [], columns = [], projects = [] }) {
  const normalizedColumns = columns.map(normalizeColumn)
  const columnMap = new Map(normalizedColumns.map((column) => [column.slug, column]))

  const normalizedArticles = articles
    .map(normalizeArticle)
    .filter((article) => article.status === 'published' && article.slug)
    .sort(sortByPublishDate)

  const articleSummaries = normalizedArticles.map((article) => summarizeArticle(article, columnMap))
  const featuredArticles = articleSummaries.filter((article) => article.pinned).sort(sortFeatured).slice(0, 3)

  const articleDetails = {}

  for (const article of normalizedArticles) {
    const summary = summarizeArticle(article, columnMap)
    const currentIndex = articleSummaries.findIndex((item) => item.slug === article.slug)
    const previous = currentIndex < articleSummaries.length - 1 ? articleSummaries[currentIndex + 1] : null
    const next = currentIndex > 0 ? articleSummaries[currentIndex - 1] : null

    articleDetails[article.slug] = {
      ...summary,
      contentMarkdown: article.contentMarkdown,
      seoTitle: article.seoTitle || article.title,
      seoDescription: article.seoDescription || article.excerpt,
      toc: extractHeadings(article.contentMarkdown),
      previous,
      next,
      enableComments: article.enableComments !== false,
    }
  }

  const searchEntries = [
    ...normalizedArticles.map(buildArticleSearchEntry),
    ...projects.map((project) => ({
      ...project,
      searchText: `${project.searchText || ''}`.toLowerCase(),
    })),
  ]

  return {
    index: {
      generatedAt: new Date().toISOString(),
      pageSize: BLOG_PAGE_SIZE,
      featured: featuredArticles,
      articles: articleSummaries,
      taxonomies: {
        columns: buildColumnSummary(normalizedColumns, normalizedArticles),
        languages: buildLanguageSummary(normalizedArticles),
        tags: buildTagSummary(normalizedArticles.flatMap((article) => article.tags)),
        types: buildTypeSummary(normalizedArticles),
      },
    },
    search: {
      generatedAt: new Date().toISOString(),
      entries: searchEntries,
    },
    articleDetails,
  }
}
