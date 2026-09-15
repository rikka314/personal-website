import { ArrowUpRight } from 'lucide-react'
import { getProjects, projectsPageCopy } from '../data/projects'
import { useLocale } from '../context/useLocale'

export default function Projects() {
  const { locale } = useLocale()
  const copy = projectsPageCopy[locale]
  return (
    <section className="section-shell">
      <div className="page-shell">
        <header className="section-header">
          <p className="eyebrow">
            {locale === 'zh' ? '研究与实践' : 'Research & practice'}
          </p>
          <h1 className="page-title">
            {locale === 'zh' ? '项目选集' : 'Selected projects.'}
          </h1>
        </header>
        {getProjects(locale).map((project, index) => (
          <article
            key={project.id}
            className={`project-entry ${project.featured ? 'project-featured' : ''}`}
          >
            <span className="project-number">0{index + 1}</span>
            <div className="min-w-0">
              <p className="tiny-label">{project.status}</p>
              <h2 className="project-name">{project.title}</h2>
              <div className="project-description">
                <div>
                  <h3 className="tiny-label">{copy.summaryLabel}</h3>
                  <p className="mt-3">{project.summary}</p>
                </div>
                <div>
                  <h3 className="tiny-label">{copy.outcomeLabel}</h3>
                  <p className="mt-3">{project.outcome}</p>
                </div>
              </div>
              <div className="project-footer">
                <div className="flex flex-wrap gap-3">
                  {project.stack.map((item) => (
                    <span className="chip" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
                {project.link ? (
                  <a
                    className="text-link"
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {copy.openProject}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                ) : (
                  <span className="tiny-label">{copy.privateBuild}</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
