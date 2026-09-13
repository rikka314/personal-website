import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLocale } from '../context/useLocale'

export default function Hero() {
  const { locale } = useLocale()

  const copy =
    locale === 'zh'
      ? {
          ctaPrimary: '查看项目',
          ctaSecondary: '阅读博客',
          eyebrow: '本科科研画像',
          facts: [
            {
              label: '院校',
              value: '香港中文大学（深圳）人工智能学院',
            },
            {
              label: '学位',
              value: '人工智能工学学士 · 预计 2029 年毕业',
            },
            {
              label: '研究兴趣',
              value: '大语言模型、具身智能、计算机视觉',
            },
          ],
          intro:
            '我目前就读于香港中文大学（深圳）人工智能学院人工智能专业，正在围绕大语言模型、具身智能和计算机视觉建立研究基础，并通过模型复现、量化分析工具和系统型软件项目持续积累可迁移的工程能力。',
          sequence: [
            '大语言模型',
            1800,
            '具身智能',
            1800,
            '计算机视觉',
            1800,
            '模型复现',
            1800,
          ],
          strengths: [
            '在 WSL/Ubuntu 环境中复现 FinGPT v3 情感分析流程，完成 QLoRA 微调与双后端推理评测',
            '构建并云端部署量化金融分析平台，覆盖 10 因子评分、回测与参数优化',
            '协作开发航运模拟游戏，整合 Tkinter GUI、MySQL 持久化和 PyInstaller 打包',
          ],
          subtitle:
            '面向 LLM、具身智能与计算机视觉持续构建工程基础的 AI 本科生。',
          trajectoryBody:
            '我默认的工作方式是先把系统跑起来，再把它稳定下来：先复现模型、打通数据和部署链路，再整理实验与文档。',
          trajectoryLabel: '当前方向',
          trajectoryTitle: '研究导向的工程训练',
          academicBody:
            '课程基础包括微积分、线性代数与 Python；在 2026 MCM 中完成过优化建模、可靠性分析和整篇论文写作，并已开始阅读 Transformer、ResNet、AlexNet 等深度学习基础文献。',
          academicLabel: '学术与竞赛基础',
        }
      : {
          ctaPrimary: 'View projects',
          ctaSecondary: 'Read notes',
          eyebrow: 'Undergraduate Research Profile',
          facts: [
            {
              label: 'School',
              value: 'School of Artificial Intelligence, CUHK-Shenzhen',
            },
            {
              label: 'Degree',
              value: 'B.Eng. in Artificial Intelligence · Expected 2029',
            },
            {
              label: 'Research interests',
              value: 'Large Language Models, Embodied AI, and Computer Vision',
            },
          ],
          intro:
            'I am a first-year Artificial Intelligence student at CUHK-Shenzhen, building toward research in large language models, embodied AI, and computer vision through hands-on work in model reproduction, quantitative tooling, and systems-oriented software projects.',
          sequence: [
            'Large Language Models',
            1800,
            'Embodied AI',
            1800,
            'Computer Vision',
            1800,
            'Model Reproduction',
            1800,
          ],
          strengths: [
            'Reproduced the FinGPT v3 sentiment workflow in WSL/Ubuntu with QLoRA fine-tuning and dual-backend evaluation',
            'Built and deployed a quantitative finance platform with 10-factor scoring, backtesting, and parameter optimization',
            'Co-developed a shipping simulation game with a Tkinter GUI, MySQL persistence, and PyInstaller packaging',
          ],
          subtitle:
            'AI undergraduate building research-ready engineering depth in LLMs, embodied AI, and computer vision.',
          trajectoryBody:
            'My default workflow is to make systems run first and stabilize them next: reproduce models, wire data and deployment paths, and then tighten the experimental story.',
          trajectoryLabel: 'Current trajectory',
          trajectoryTitle: 'Research-oriented engineering',
          academicBody:
            'Coursework includes Calculus, Linear Algebra, and Python. In MCM 2026, I built optimization and reliability models, wrote the full paper, and strengthened my habit of reading foundational deep learning papers in English.',
          academicLabel: 'Academic and competition base',
        }

  return (
    <>
      <section className="hero">
        <div className="page-shell">
          <div className="hero-kicker">
            <p className="eyebrow">{copy.eyebrow}</p>
            <span className="folio">CUHK · Shenzhen</span>
          </div>
          <h1 className="hero-name">
            Steve Huang<span className="text-accent">.</span>
          </h1>
          <div className="hero-intro-grid">
            <div>
              <p className="hero-subtitle">{copy.subtitle}</p>
              <div className="research-keywords">
                {copy.sequence
                  .filter((item) => typeof item === 'string')
                  .map((item) => (
                    <span key={item}>{item}</span>
                  ))}
              </div>
            </div>
            <div>
              <p className="hero-intro">{copy.intro}</p>
              <div className="hero-actions">
                <Link className="text-link" to="/projects">
                  {copy.ctaPrimary}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <Link className="text-link" to="/blog">
                  {copy.ctaSecondary}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
          <dl className="profile-facts">
            {copy.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="tiny-label">{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <section className="chapter">
        <div className="page-shell chapter-grid">
          <div>
            <p className="eyebrow">01 / {copy.trajectoryLabel}</p>
            <h2 className="chapter-heading">{copy.trajectoryTitle}</h2>
          </div>
          <div className="chapter-body">
            <p>{copy.trajectoryBody}</p>
            <ol className="experience-list">
              {copy.strengths.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <h3 className="tiny-label">{copy.academicLabel}</h3>
              <p className="mt-4">{copy.academicBody}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
