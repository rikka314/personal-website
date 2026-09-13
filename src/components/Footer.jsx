import { useLocale } from '../context/useLocale'
export default function Footer() {
  const { locale } = useLocale()
  return (
    <footer className="site-footer">
      <div className="page-shell footer-row">
        <div>
          <p>
            © {new Date().getFullYear()} Steve Huang.{' '}
            {locale === 'zh' ? '保留所有权利。' : 'All rights reserved.'}
          </p>
          <p className="mt-1">
            {locale === 'zh'
              ? '基于 React、Vite、Tailwind CSS 与静态博客运行时构建。'
              : 'Built with React, Vite, Tailwind CSS, and a static blog runtime.'}
          </p>
        </div>
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
          ICP备案 2026020082号 ↗
        </a>
      </div>
    </footer>
  )
}
