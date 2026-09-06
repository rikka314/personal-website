import { useEffect, useState } from 'react'
import { Github } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'
import { useLocale } from '../context/useLocale'
import { getAdminLoginUrl } from '../lib/site'
import AdminDashboard from './AdminDashboard'
import AdminEditor from './AdminEditor'
import AdminShell from './AdminShell'
import { getSession, loginWithPassword, logout } from './api'

const copyByLocale = {
  en: {
    addColumn: 'Add column',
    articleList: 'Article list',
    backToDashboard: 'Back to dashboard',
    column: 'Column',
    columnList: 'Columns',
    columnsTitle: 'Active columns',
    coverImage: 'Cover image URL',
    dashboard: 'Dashboard',
    dashboardTitle: 'Drafts and published entries',
    delete: 'Delete',
    editorLabel: 'Editor',
    editorTitle: 'Write and publish',
    enableComments: 'Enable comments',
    eyebrow: 'Blog Admin',
    footer: 'The writing surface for this site.',
    importAction: 'Import markdown',
    importAssets: 'Related images',
    importBody:
      'Import a local Markdown file and a batch of images. The backend parses front matter, rewrites image paths, and stores the result as a draft or published post.',
    importLabel: 'Import',
    importMarkdown: 'Markdown file',
    importStatus: 'Import as',
    importTitle: 'Local markdown import',
    importing: 'Importing',
    language: 'Language',
    loading: 'Loading admin data.',
    logout: 'Log out',
    newArticle: 'New article',
    newColumnPlaceholder: 'Create a new column',
    openPublicSite: 'Open public blog',
    pinOrder: 'Pin order',
    pinned: 'Pinned',
    previewEmpty: 'Start writing in Markdown to preview the post here.',
    previewLabel: 'Preview',
    previewTitle: 'Live preview',
    publishDate: 'Publish date',
    publishNow: 'Publish now',
    saveDraft: 'Save draft',
    seoDescription: 'SEO description',
    seoTitle: 'SEO title',
    slug: 'Slug',
    statColumns: 'Columns',
    statDrafts: 'Drafts',
    statPublished: 'Published',
    tags: 'Tags (comma separated)',
    title: 'Title',
    type: 'Type',
    unpublish: 'Move to draft',
    uploadImage: 'Upload image',
    excerpt: 'Excerpt',
  },
  zh: {
    addColumn: '新增专栏',
    articleList: '文章列表',
    backToDashboard: '返回面板',
    column: '专栏',
    columnList: '专栏',
    columnsTitle: '当前专栏',
    coverImage: '封面图链接',
    dashboard: '面板',
    dashboardTitle: '草稿与已发布文章',
    delete: '删除',
    editorLabel: '编辑器',
    editorTitle: '写作与发布',
    enableComments: '开启评论',
    eyebrow: '博客后台',
    footer: '这是本站的写作入口。',
    importAction: '导入 Markdown',
    importAssets: '相关图片',
    importBody:
      '导入本地 Markdown 文件和一批图片。后端会解析 front matter、重写图片路径，并保存为草稿或已发布文章。',
    importLabel: '导入',
    importMarkdown: 'Markdown 文件',
    importStatus: '导入状态',
    importTitle: '本地 Markdown 导入',
    importing: '导入中',
    language: '语言',
    loading: '正在加载后台数据。',
    logout: '退出登录',
    newArticle: '新建文章',
    newColumnPlaceholder: '创建新专栏',
    openPublicSite: '打开前台博客',
    pinOrder: '置顶顺序',
    pinned: '置顶',
    previewEmpty: '开始写 Markdown 后，这里会实时预览。',
    previewLabel: '预览',
    previewTitle: '实时预览',
    publishDate: '发布时间',
    publishNow: '立即发布',
    saveDraft: '保存草稿',
    seoDescription: 'SEO 描述',
    seoTitle: 'SEO 标题',
    slug: 'Slug',
    statColumns: '专栏数',
    statDrafts: '草稿数',
    statPublished: '已发布',
    tags: '标签（逗号分隔）',
    title: '标题',
    type: '类型',
    unpublish: '撤回为草稿',
    uploadImage: '上传图片',
    excerpt: '摘要',
  },
}

function LoginScreen({
  authConfigured = true,
  locale,
  oauthConfigured = false,
  onPasswordSubmit,
  passwordAuthConfigured = false,
}) {
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const isZh = locale === 'zh'

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!passwordAuthConfigured || !onPasswordSubmit) {
      return
    }

    setErrorMessage('')

    try {
      await onPasswordSubmit(password)
      setPassword('')
    } catch (error) {
      setErrorMessage(error.message || (isZh ? '登录失败。' : 'Sign-in failed.'))
    }
  }

  return (
    <section className="section-shell">
      <div className="page-shell">
        <div className="panel mx-auto max-w-2xl p-8 md:p-10">
          <p className="eyebrow">{isZh ? '博客后台' : 'Blog Admin'}</p>
          <h1 className="mt-3 text-4xl text-text md:text-5xl">
            <span className="font-display italic">{isZh ? '博客写作入口' : 'Writing surface'}</span>
          </h1>
          <p className="mt-5 text-base leading-8 text-muted">
            {isZh
              ? '这里用于管理博客文章、图片和发布流程；启用 GitHub OAuth 后，登录用户即可写作与发布。'
              : 'This surface manages blog posts, assets, and publishing; once GitHub OAuth is enabled, signed-in users can write and publish.'}
          </p>

          {passwordAuthConfigured ? (
            <form className="mt-8 grid gap-3" onSubmit={handleSubmit}>
              <input
                autoComplete="current-password"
                className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm text-text outline-none placeholder:text-muted"
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isZh ? '输入后台密码' : 'Enter the admin password'}
                type="password"
                value={password}
              />
              {errorMessage ? <p className="text-sm text-accent-hi">{errorMessage}</p> : null}
              <button className="button-primary justify-center" type="submit">
                {isZh ? '使用密码登录' : 'Sign in with password'}
              </button>
            </form>
          ) : null}

          {oauthConfigured ? (
            <a className="button-secondary mt-4" href={getAdminLoginUrl()}>
              <Github size={16} />
              {isZh ? '使用 GitHub 登录' : 'Sign in with GitHub'}
            </a>
          ) : null}

          {!authConfigured ? (
            <div aria-disabled="true" className="button-secondary mt-8 cursor-not-allowed opacity-70">
              <Github size={16} />
              {isZh ? '服务器仍需补齐认证配置' : 'Server authentication still needs configuration'}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default function AdminApp() {
  const { locale } = useLocale()
  const copy = copyByLocale[locale]
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      setIsLoading(true)

      try {
        const payload = await getSession()
        if (!cancelled) {
          setSession(payload)
        }
      } catch {
        if (!cancelled) {
          setSession({
            authenticated: false,
            authConfigured: true,
            oauthConfigured: false,
            passwordAuthConfigured: false,
          })
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

  const handlePasswordLogin = async (password) => {
    const payload = await loginWithPassword(password)
    setSession((current) => ({
      ...current,
      authenticated: true,
      user: payload.user,
    }))
  }

  const handleLogout = async () => {
    await logout()
    window.location.reload()
  }

  if (isLoading) {
    return <LoginScreen authConfigured locale={locale} />
  }

  if (!session?.authenticated) {
    return (
      <LoginScreen
        authConfigured={session?.authConfigured !== false}
        locale={locale}
        oauthConfigured={session?.oauthConfigured === true}
        onPasswordSubmit={handlePasswordLogin}
        passwordAuthConfigured={session?.passwordAuthConfigured === true}
      />
    )
  }

  return (
    <AdminShell copy={copy} onLogout={handleLogout} session={session}>
      <Routes>
        <Route element={<AdminDashboard copy={copy} locale={locale} />} path="/" />
        <Route element={<AdminEditor copy={copy} locale={locale} />} path="/articles/new" />
        <Route element={<AdminEditor copy={copy} locale={locale} />} path="/articles/:articleId" />
      </Routes>
    </AdminShell>
  )
}
