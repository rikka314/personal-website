import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import 'katex/dist/katex.min.css'
import ReactMarkdown from 'react-markdown'
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeHeadingIds from '../lib/blog/headingIds'
import { extractHeadings } from '../lib/blog/runtime'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { useLocale } from '../context/useLocale'
import { useTheme } from '../context/useTheme'

SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('jsx', jsx)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('typescript', typescript)

function CopyCodeButton({ value }) {
  const [copied, setCopied] = useState(false)
  const { locale } = useLocale()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button className="blog-code-copy" onClick={handleCopy} type="button">
      {copied ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <Copy size={14} aria-hidden="true" />
      )}
      <span aria-live="polite">
        {locale === 'zh'
          ? copied
            ? '已复制'
            : '复制'
          : copied
            ? 'Copied'
            : 'Copy'}
      </span>
    </button>
  )
}

export default function MarkdownContent({ markdown, headings }) {
  const { isDark } = useTheme()

  return (
    <div className="prose-blog">
      <ReactMarkdown
        rehypePlugins={[
          rehypeSlug,
          [
            rehypeHeadingIds,
            { headings: headings ?? extractHeadings(markdown), markdown },
          ],
          rehypeKatex,
        ]}
        remarkPlugins={[remarkGfm, remarkMath]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              rel="noreferrer"
              target={href?.startsWith('http') ? '_blank' : '_self'}
            >
              {children}
            </a>
          ),
          pre({ children }) {
            return <>{children}</>
          },
          code({ children, className, node, ...props }) {
            const rawValue = String(children).replace(/\n$/, '')
            const language = className?.replace('language-', '') || 'text'

            if (
              !className &&
              node?.position?.start.line === node?.position?.end.line &&
              !String(children).includes('\n')
            ) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }

            return (
              <div className="blog-code-shell">
                <div className="blog-code-toolbar">
                  <span>{language}</span>
                  <CopyCodeButton value={rawValue} />
                </div>
                <SyntaxHighlighter
                  {...props}
                  customStyle={{ margin: 0, background: 'transparent' }}
                  language={language}
                  style={isDark ? oneDark : oneLight}
                >
                  {rawValue}
                </SyntaxHighlighter>
              </div>
            )
          },
          img: ({ src, alt }) => (
            <img
              alt={alt ?? ''}
              className="blog-image"
              loading="lazy"
              decoding="async"
              src={src}
            />
          ),
          table: ({ children }) => (
            <div className="blog-table-shell">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
