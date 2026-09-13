// Share runtime TOC IDs with rendered ATX headings. Other Markdown headings keep
// rehype-slug IDs, so a Setext heading cannot shift subsequent TOC targets.
export default function rehypeHeadingIds({ headings, markdown }) {
  const lines = markdown.split(/\r?\n/)
  return (tree) => {
    let index = 0
    function visit(node) {
      const sourceLine = lines[(node.position?.start.line ?? 0) - 1] ?? ''
      if (
        node.type === 'element' &&
        ['h2', 'h3'].includes(node.tagName) &&
        /^#{2,3}\s+/.test(sourceLine)
      ) {
        const heading = headings[index++]
        if (heading) node.properties = { ...node.properties, id: heading.id }
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}
