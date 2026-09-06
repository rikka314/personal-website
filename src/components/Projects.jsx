import { ArrowUpRight, BarChart3, Bot, Globe } from 'lucide-react'
import { getProjects, projectsPageCopy } from '../data/projects'
import { useLocale } from '../context/useLocale'

const iconMap = {
  'bar-chart-3': BarChart3,
  bot: Bot,
  globe: Globe,
}

export default function Projects() {
  const { locale } = useLocale()
  const copy = projectsPageCopy[locale]
  const items = getProjects(locale)

  return (
    <section className="section-shell">
      <div className="page-shell">
        <div className="section-header">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 className="section-title">{copy.sectionTitle}</h2>
          <p className="section-copy">{copy.sectionCopy}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((project) => {
            const Icon = iconMap[project.iconKey] ?? Globe

            return (
              <article
                key={project.id}
                className={`panel panel-hover p-7 md:p-8 ${
                  project.featured ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="icon-shell h-14 w-14">
                      <Icon size={22} />
                    </div>
                    <div>
                      <p className="tiny-label">{project.status}</p>
                      <h3 className="mt-1 text-2xl font-semibold text-text">{project.title}</h3>
                    </div>
                  </div>
                  {project.link ? (
                    <a
                      className="button-secondary"
                      href={project.link}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {copy.openProject}
                      <ArrowUpRight size={15} />
                    </a>
                  ) : (
                    <span className="chip">{copy.privateBuild}</span>
                  )}
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="tiny-label">{copy.summaryLabel}</p>
                    <p className="mt-3 text-sm leading-7 text-muted">{project.summary}</p>
                  </div>
                  <div>
                    <p className="tiny-label">{copy.outcomeLabel}</p>
                    <p className="mt-3 text-sm leading-7 text-muted">{project.outcome}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {project.stack.map((item) => (
                    <span key={item} className="chip">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
