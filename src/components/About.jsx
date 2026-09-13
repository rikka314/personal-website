import { useLocale } from '../context/useLocale'

const highlightCards = [
  {
    title: 'Research focus',
    description:
      'I am building toward research in large language models, embodied AI, and computer vision.',
  },
  {
    title: 'ML toolkit',
    description:
      'I already work with scikit-learn, LightGBM, Optuna, Hugging Face Transformers, and LoRA/QLoRA workflows.',
  },
  {
    title: 'Systems and deployment',
    description:
      'Git, Linux, SSH, systemd, MySQL, and cloud deployment are already part of how I build and debug projects.',
  },
  {
    title: 'Academic preparation',
    description:
      'I can read foundational deep learning papers in English and have MCM experience in modeling, sensitivity analysis, and technical writing.',
  },
]

const contributionAreas = [
  'Baseline reproduction, environment setup, and training or inference pipeline bring-up',
  'Data processing, feature engineering, and lightweight research tooling',
  'Python and Streamlit prototyping with cloud deployment support',
  'Experiment notes, result organization, and foundational paper reading support',
]

export default function About() {
  const { locale } = useLocale()

  const copy =
    locale === 'zh'
      ? {
          copy: '我还处在本科早期阶段，但已经开始把研究兴趣落到可运行的系统、可复现的实验和结构化技术工作上。',
          eyebrow: '关于',
          goalBody:
            '先在研究组中承担 baseline 复现、数据处理和实验支持，再逐步进入更深入的模型理解、论文阅读和研究设计。',
          goalLabel: '当前目标',
          intro1:
            '我当前最明确的研究兴趣是大语言模型、具身智能和计算机视觉。相比只停留在课程层面，我更希望通过复现和搭建具体系统，尽早进入真实的研究工作流。',
          intro2:
            '这也是我为什么会做 FinGPT 本地复现和量化金融平台。前者让我在 WSL/Ubuntu 环境里跑通 Llama-2-7B + 4-bit QLoRA 微调、FPB 数据集评测和双后端推理；后者则让我把 AkShare 数据、10 因子评分、Walk-Forward 回测和参数优化组织成可在线使用的 Streamlit 应用。',
          intro3:
            '除此之外，我还协作开发过带 Tkinter 界面和 MySQL 持久化的航运模拟游戏，并在 MCM 中完成过建模、敏感性分析和论文写作。这些经历让我对系统拆解、实验记录和工程交付形成了更具体的判断。',
          sectionTitle: '一个已经开始把研究兴趣变成系统和实验的 AI 本科生。',
          sideLabel: '我现在能承担什么',
        }
      : {
          copy: 'I am still early in undergraduate study, but I am already turning research interest into runnable systems, reproducible experiments, and structured technical work.',
          eyebrow: 'About',
          goalBody:
            'Contribute first through baseline reproduction, data handling, and experiment support inside a research group, then grow into deeper model understanding, paper reading, and research design.',
          goalLabel: 'Current goal',
          intro1:
            'My clearest current research interests are large language models, embodied AI, and computer vision. Rather than keeping them at the level of coursework alone, I want to enter real research workflows by reproducing and building concrete systems.',
          intro2:
            'That is why I spent time on both a local FinGPT reproduction and a quantitative finance platform. The first pushed me through Llama-2-7B 4-bit QLoRA fine-tuning, FPB evaluation, and dual-backend inference in WSL/Ubuntu; the second turned AkShare data, 10-factor scoring, walk-forward backtesting, and parameter optimization into a usable Streamlit application.',
          intro3:
            'I also co-developed a shipping simulation game with a Tkinter interface and MySQL persistence, and I used MCM to practice modeling, sensitivity analysis, and technical writing. Together, those experiences gave me a more concrete sense of system decomposition, experiment tracking, and disciplined delivery.',
          sectionTitle:
            'An AI undergraduate already translating research interest into systems and experiments.',
          sideLabel: 'Where I can contribute now',
        }

  const localizedHighlights =
    locale === 'zh'
      ? [
          {
            title: '研究方向',
            description:
              '当前重点关注大语言模型、具身智能和计算机视觉，并希望尽早进入真实研究场景。',
          },
          {
            title: '机器学习工具链',
            description:
              '已经在用 scikit-learn、LightGBM、Optuna、Hugging Face Transformers 和 LoRA/QLoRA 做项目与复现。',
          },
          {
            title: '系统与部署',
            description:
              '熟悉 Git、Linux、SSH、systemd、MySQL，以及从本地环境到云端部署的基本链路。',
          },
          {
            title: '学术准备',
            description:
              '参与过 MCM 建模并能阅读 Transformer、ResNet、AlexNet 等基础英文文献。',
          },
        ]
      : highlightCards

  const localizedContributionAreas =
    locale === 'zh'
      ? [
          'baseline 复现、环境配置与训练/推理链路打通',
          '数据处理、特征工程与轻量研究工具开发',
          'Python / Streamlit 原型实现与云端部署支持',
          '实验记录、结果整理与英文基础论文阅读',
        ]
      : contributionAreas

  return (
    <section className="section-shell about-section">
      <div className="page-shell">
        <div className="section-header">
          <p className="eyebrow">02 / {copy.eyebrow}</p>
          <h2 className="section-title">{copy.sectionTitle}</h2>
          <p className="section-copy">{copy.copy}</p>
        </div>

        <div className="about-columns">
          <article className="min-w-0">
            <p className="text-base leading-8 text-muted">{copy.intro1}</p>
            <p className="mt-5 text-base leading-8 text-muted">{copy.intro2}</p>
            <p className="mt-5 text-base leading-8 text-muted">{copy.intro3}</p>
          </article>

          <aside className="min-w-0">
            <p className="tiny-label">{copy.sideLabel}</p>
            <ul className="contribution-list">
              {localizedContributionAreas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="tint-surface mt-8 pl-5">
              <p className="tiny-label">{copy.goalLabel}</p>
              <p className="mt-3 text-sm leading-7 text-text">
                {copy.goalBody}
              </p>
            </div>
          </aside>
        </div>

        <div className="highlight-grid">
          {localizedHighlights.map((card) => (
            <div key={card.title} className="highlight-item">
              <h3 className="mt-3 text-lg font-semibold text-text">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
