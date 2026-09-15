const projectCatalog = [
  {
    id: 'quant-strategy-platform',
    iconKey: 'bar-chart-3',
    featured: true,
    link: 'https://gfm156.com/strategy/',
    status: {
      en: 'Live project',
      zh: '在线项目',
    },
    translations: {
      en: {
        title: 'Quantitative finance analysis platform',
        summary:
          'A modular Streamlit platform for factor-based stock analysis, strategy backtesting, parameter optimization, and portfolio exploration, deployed on an Ubuntu cloud server.',
        outcome:
          'This project taught me how to connect data pipelines, quantitative metrics, optimization loops, and deployment concerns into one usable research tool.',
        stack: ['Python', 'Streamlit', 'AkShare', 'Optuna'],
      },
      zh: {
        title: '量化金融分析平台',
        summary:
          '一个基于 Streamlit 的模块化量化平台，整合了 AkShare 数据、10 因子评分、策略回测、参数优化和组合分析，并已部署到 Ubuntu 云服务器。',
        outcome:
          '这个项目让我系统练习了数据管线、量化指标、优化流程和部署链路，开始把分析想法整理成真正可用的研究工具。',
        stack: ['Python', 'Streamlit', 'AkShare', 'Optuna'],
      },
    },
  },
  {
    id: 'shipping-simulation-game',
    iconKey: 'globe',
    featured: false,
    link: 'https://github.com/rikka314/AIE-shipgame',
    status: {
      en: 'Co-developed',
      zh: '协作开发',
    },
    translations: {
      en: {
        title: 'Shipping simulation game',
        summary:
          'A turn-based shipping simulation game built with a custom Python engine, a Tkinter desktop UI, a unified command queue, and MySQL-backed persistent state.',
        outcome:
          'Building it strengthened my understanding of state management, cross-module system behavior, packaging, and the tradeoffs of making a complex simulation usable.',
        stack: ['Python', 'Tkinter', 'MySQL', 'PyInstaller'],
      },
      zh: {
        title: '航运模拟游戏',
        summary:
          '一个回合制航运贸易模拟项目，包含自定义 Python 游戏引擎、Tkinter 桌面界面、统一指令队列，以及基于 MySQL 的持久化状态管理。',
        outcome:
          '这个项目让我更系统地理解状态管理、跨模块交互、桌面打包和复杂模拟系统如何被做成可实际使用的软件。',
        stack: ['Python', 'Tkinter', 'MySQL', 'PyInstaller'],
      },
    },
  },
]

export const projectsPageCopy = {
  en: {
    eyebrow: 'Projects',
    openProject: 'Open project',
    privateBuild: 'Private build',
    summaryLabel: 'Project summary',
    outcomeLabel: 'What it taught me',
  },
  zh: {
    eyebrow: '项目',
    openProject: '打开项目',
    privateBuild: '未公开项目',
    summaryLabel: '项目简介',
    outcomeLabel: '我从中学到什么',
  },
}

export function getProjects(locale = 'en') {
  const resolvedLocale = locale === 'zh' ? 'zh' : 'en'

  return projectCatalog.map((project) => ({
    id: project.id,
    iconKey: project.iconKey,
    featured: project.featured,
    link: project.link,
    status: project.status[resolvedLocale],
    ...project.translations[resolvedLocale],
  }))
}

export function getProjectSearchEntries() {
  return projectCatalog.map((project) => {
    const searchableText = [
      project.translations.en.title,
      project.translations.en.summary,
      project.translations.en.outcome,
      project.translations.en.stack.join(' '),
      project.translations.zh.title,
      project.translations.zh.summary,
      project.translations.zh.outcome,
      project.translations.zh.stack.join(' '),
      project.status.en,
      project.status.zh,
    ].join(' ')

    return {
      id: project.id,
      kind: 'project',
      url: project.link ?? '/projects',
      featured: project.featured,
      searchText: searchableText,
      translations: {
        en: {
          title: project.translations.en.title,
          excerpt: project.translations.en.summary,
          meta: project.status.en,
        },
        zh: {
          title: project.translations.zh.title,
          excerpt: project.translations.zh.summary,
          meta: project.status.zh,
        },
      },
    }
  })
}
