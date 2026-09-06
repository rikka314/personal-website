import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { blogArticlesSeed, blogColumnsSeed } from '../src/data/blogSeed.js'
import { getProjectSearchEntries } from '../src/data/projects.js'
import { buildBlogRuntime } from '../src/lib/blog/runtime.js'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDirectory, '..')
const sourceRoot = process.env.BLOG_SOURCE_ROOT
  ? path.resolve(process.cwd(), process.env.BLOG_SOURCE_ROOT)
  : path.join(repoRoot, 'storage', 'blog-source')
const publicRoot = process.env.BLOG_PUBLIC_ROOT
  ? path.resolve(process.cwd(), process.env.BLOG_PUBLIC_ROOT)
  : path.join(repoRoot, 'server', 'seeds', 'blog-runtime')
const allowSeedFallback = process.env.BLOG_ALLOW_SEED_FALLBACK !== 'false'

async function readJsonFile(filePath) {
  const contents = await readFile(filePath, 'utf8')
  return JSON.parse(contents)
}

async function pathExists(targetPath) {
  try {
    await readdir(targetPath)
    return true
  } catch {
    return false
  }
}

async function loadSourceContent() {
  const articlesDirectory = path.join(sourceRoot, 'articles')
  const columnsFile = path.join(sourceRoot, 'columns.json')
  const articlesDirectoryExists = await pathExists(articlesDirectory)

  if (!articlesDirectoryExists) {
    if (!allowSeedFallback) {
      throw new Error(`Source article directory was not found: ${articlesDirectory}`)
    }

    return {
      articles: blogArticlesSeed,
      columns: blogColumnsSeed,
      source: 'seed',
    }
  }

  const articleFiles = (await readdir(articlesDirectory)).filter((fileName) => fileName.endsWith('.json'))
  let columns = blogColumnsSeed

  try {
    columns = await readJsonFile(columnsFile)
  } catch {
    columns = articleFiles.length === 0 ? [] : blogColumnsSeed
  }

  if (articleFiles.length === 0) {
    return {
      articles: [],
      columns,
      source: 'storage-empty',
    }
  }

  const articles = await Promise.all(
    articleFiles.map((fileName) => readJsonFile(path.join(articlesDirectory, fileName))),
  )

  return {
    articles,
    columns,
    source: 'storage',
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function main() {
  const { articles, columns, source } = await loadSourceContent()
  const runtime = buildBlogRuntime({
    articles,
    columns,
    projects: getProjectSearchEntries(),
  })

  await mkdir(publicRoot, { recursive: true })
  await writeJson(path.join(publicRoot, 'index.json'), runtime.index)
  await writeJson(path.join(publicRoot, 'search.json'), runtime.search)

  await rm(path.join(publicRoot, 'articles'), { force: true, recursive: true })

  await Promise.all(
    Object.entries(runtime.articleDetails).map(([slug, article]) =>
      writeJson(path.join(publicRoot, 'articles', `${slug}.json`), article),
    ),
  )

  console.log(
    `Generated blog runtime in ${publicRoot} from ${source} data (${runtime.index.articles.length} published articles).`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
