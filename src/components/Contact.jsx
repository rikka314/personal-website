import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLocale } from '../context/useLocale'

const profileCards = {
  en: [
    {
      title: 'Location',
      body: 'Based in Shenzhen, China, and studying at CUHK-Shenzhen.',
    },
    {
      title: 'Research fit',
      body: 'Interested in Computer Vision, Embodied AI, deep learning, and visual perception.',
    },
    {
      title: 'Weekly commitment',
      body: 'Available for roughly 8 hours each week of undergraduate research work.',
    },
  ],
  zh: [
    {
      title: '所在地',
      body: '目前在深圳，就读于香港中文大学（深圳）。',
    },
    {
      title: '研究匹配度',
      body: '主要兴趣集中在计算机视觉、具身智能、深度学习和视觉感知。',
    },
    {
      title: '每周时间',
      body: '目前每周大约可以稳定投入 8 小时参与本科科研工作。',
    },
  ],
}

const supportAreas = {
  en: [
    'Running and checking baselines with care',
    'Writing scripts, utilities, and lightweight tooling',
    'Helping maintain local AI environments and dependencies',
    'Documenting what worked, what failed, and what to try next',
  ],
  zh: [
    '认真执行并检查 baseline 运行',
    '编写脚本、工具与轻量辅助界面',
    '维护本地 AI 环境与依赖配置',
    '把过程中有效的方法、失败点和下一步整理清楚',
  ],
}

const pageCopy = {
  en: {
    eyebrow: 'Contact',
    sectionTitle: 'Research-minded, available, and ready to contribute.',
    sectionCopy:
      'This page focuses on fit rather than public social links. I have removed all placeholder contact details, and I only publish information here that I can confidently stand behind.',
    primaryCta: 'Review project work',
    secondaryCta: 'Read technical notes',
    supportBody:
      'If you reached this site through my CV or a direct introduction, the best next step is to continue the conversation through that existing channel. I am most useful when a team needs someone who can learn quickly, execute carefully, and help turn research tasks into reliable working routines.',
    supportLabel: 'How I can help',
    supportTitle: 'Best suited for early research support with strong engineering follow-through.',
  },
  zh: {
    eyebrow: '联系',
    sectionTitle: '科研导向明确，也已经准备好投入和贡献。',
    sectionCopy:
      '这个页面更强调“适合做什么”，而不是公开社交链接。我已经移除了所有占位联系方式，只保留我能确认无误的信息。',
    primaryCta: '查看项目',
    secondaryCta: '阅读博客',
    supportBody:
      '如果你是通过我的 CV 或直接介绍来到这里，最合适的下一步就是沿用现有沟通渠道继续交流。我更适合承担那些需要快速学习、认真执行，并把研究任务变成稳定工作流的支持性工作。',
    supportLabel: '我能提供什么支持',
    supportTitle: '适合承担早期科研支持与工程执行类工作。',
  },
}

export default function Contact() {
  const { locale } = useLocale()
  const cards = profileCards[locale]
  const items = supportAreas[locale]
  const copy = pageCopy[locale]

  return (
    <section className="section-shell">
      <div className="page-shell">
        <div className="section-header">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 className="section-title">{copy.sectionTitle}</h2>
          <p className="section-copy">{copy.sectionCopy}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4">
            {cards.map((card) => (
              <div key={card.title} className="panel panel-hover p-6">
                <p className="tiny-label">{card.title}</p>
                <p className="mt-3 text-base leading-7 text-text">{card.body}</p>
              </div>
            ))}
          </div>

          <div className="panel p-7 md:p-8">
            <p className="tiny-label">{copy.supportLabel}</p>
            <h3 className="mt-3 text-2xl font-semibold text-text">{copy.supportTitle}</h3>
            <p className="mt-4 text-sm leading-7 text-muted">{copy.supportBody}</p>

            <div className="mt-6 grid gap-3">
              {items.map((item) => (
                <div key={item} className="soft-surface px-4 py-4 text-sm leading-7 text-muted">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link className="button-primary" to="/projects" viewTransition>
                {copy.primaryCta}
                <ArrowRight size={16} />
              </Link>
              <Link className="button-secondary" to="/blog" viewTransition>
                {copy.secondaryCta}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
