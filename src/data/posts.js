const posts = [
  {
    slug: 'quant-backtest-system',
    date: '2026-03-01',
    translations: {
      en: {
        title: 'Building a Quantitative Backtesting Workflow from Scratch',
        tags: ['Python', 'Quant', 'Web App'],
        excerpt:
          'A short write-up on turning a personal interest in quant into a usable browser-based workflow for analysis and iteration.',
        readingTime: '8 min',
      },
      zh: {
        title: '从零搭建量化回测工作流',
        tags: ['Python', '量化', 'Web 应用'],
        excerpt:
          '记录我是如何把对量化的兴趣整理成一个可在浏览器中迭代分析的实际工作流。',
        readingTime: '8 分钟',
      },
    },
  },
  {
    slug: 'shipping-simulation-game',
    date: '2026-02-20',
    translations: {
      en: {
        title: 'What a Shipping Simulation Game Taught Me About Systems Design',
        tags: ['Simulation', 'Python', 'Game Logic'],
        excerpt:
          'Why a small simulation project became a useful exercise in thinking about states, rules, and interacting components.',
        readingTime: '6 min',
      },
      zh: {
        title: '一个航运模拟游戏让我学到的系统设计',
        tags: ['模拟', 'Python', '游戏逻辑'],
        excerpt:
          '为什么一个看似小型的模拟项目，最后变成了我理解状态、规则和系统交互的训练场。',
        readingTime: '6 分钟',
      },
    },
  },
  {
    slug: 'research-ready-local-ai',
    date: '2026-02-08',
    translations: {
      en: {
        title: 'Why Local AI Workflows Matter for Student Researchers',
        tags: ['AI Agents', 'Local Models', 'Tooling'],
        excerpt:
          'A practical reflection on local model deployment, dependency management, and why systems literacy matters even before formal research begins.',
        readingTime: '7 min',
      },
      zh: {
        title: '为什么本地 AI 工作流对学生研究者很重要',
        tags: ['AI Agent', '本地模型', '工具链'],
        excerpt:
          '从本地模型部署、依赖管理到环境调试，这些系统层能力为什么在正式进入科研前就值得训练。',
        readingTime: '7 分钟',
      },
    },
  },
]

function localizePost(post, locale) {
  const content = post.translations[locale] ?? post.translations.en

  return {
    date: post.date,
    slug: post.slug,
    ...content,
  }
}

export function getPosts(locale = 'en') {
  return [...posts]
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .map((post) => localizePost(post, locale))
}

export function getPostBySlug(slug, locale = 'en') {
  const post = posts.find((item) => item.slug === slug)
  return post ? localizePost(post, locale) : null
}

export function formatPostDate(date, locale = 'en') {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: locale === 'zh' ? 'long' : 'short',
    day: 'numeric',
  }).format(new Date(date))
}
