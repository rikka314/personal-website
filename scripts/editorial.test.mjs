import test from 'node:test'
import assert from 'node:assert/strict'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeHeadingIds from '../src/lib/blog/headingIds.js'
import { extractHeadings } from '../src/lib/blog/runtime.js'

async function renderedIds(markdown) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeHeadingIds, { markdown, headings: extractHeadings(markdown) })
  const tree = await processor.run(processor.parse(markdown))
  return tree.children
    .filter((node) => /^h[23]$/.test(node.tagName))
    .map((node) => node.properties.id)
}

test('punctuated and duplicate headings resolve to the published TOC IDs', async () => {
  const markdown =
    '## 真正有价值的不是“能跑起来”\n\nText\n\n## Results\n\n## Results\n'
  assert.deepEqual(
    await renderedIds(markdown),
    extractHeadings(markdown).map((heading) => heading.id),
  )
})

test('Setext headings do not consume the next ATX heading ID', async () => {
  const markdown =
    'Introduction\n------------\n\n## A **formatted** result!\n\n### Follow-up\n'
  const ids = await renderedIds(markdown)
  assert.equal(ids[0], 'introduction')
  assert.deepEqual(
    ids.slice(1),
    extractHeadings(markdown).map((heading) => heading.id),
  )
})

test('headings inside fenced code are excluded from both TOC and rendered headings', async () => {
  const markdown = '```md\n## Not a heading\n```\n\n## Actual result\n'
  assert.deepEqual(await renderedIds(markdown), ['actual-result'])
})
