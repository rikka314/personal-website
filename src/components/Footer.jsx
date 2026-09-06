import { useLocale } from '../context/useLocale'

export default function Footer() {
  const { locale } = useLocale()

  return (
    <footer className="border-t border-border/80 py-8">
      <div className="page-shell flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-text">
            © {new Date().getFullYear()} Steve Huang.{' '}
            {locale === 'zh' ? '保留所有权利。' : 'All rights reserved.'}
          </p>
          <p className="mt-2 text-sm text-muted">
            {locale === 'zh'
              ? '基于 React、Vite、Tailwind CSS 与静态博客运行时构建。'
              : 'Built with React, Vite, Tailwind CSS, and a static blog runtime.'}
          </p>
        </div>

        <a
          className="text-sm text-muted transition hover:text-text"
          href="https://beian.miit.gov.cn/"
          rel="noreferrer"
          target="_blank"
        >
          ICP备案 2026020082号
        </a>
      </div>
    </footer>
  )
}
