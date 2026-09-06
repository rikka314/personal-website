# AI 快速上下文（个人网站项目，替代通读源码）

## 项目一句话
基于 React + Vite 的个人网站，采用 SPA 路由、双语切换、明暗主题和“主站静态运行时 + `write.gfm156.com` 写作后台”的完整博客系统；主站部署在 `https://gfm156.com`，并通过 `/strategy/` 代理到量化分析子项目。

## 技术栈
React 19 + Vite 7 + Tailwind CSS v4 + React Router v7 + `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` + `react-syntax-highlighter` + `lucide-react` + PHP/FPM（博客后台 API）

## 文件结构
```text
src/
├── main.jsx                    # 应用入口；挂载 ThemeProvider + LocaleProvider + App
├── App.jsx                     # 按 hostname 分离主站 / 写作后台；公共站点路由、后台入口、页面切换动画、滚动复位
├── index.css                   # 全局样式；Tailwind v4 主题变量、组件类、动画、明暗主题
├── admin/
│   ├── AdminApp.jsx            # `write.gfm156.com` 后台入口；登录态、路由、文案
│   ├── AdminShell.jsx          # 后台导航与整体布局
│   ├── AdminDashboard.jsx      # 文章列表、草稿/已发布统计、Markdown 导入
│   ├── AdminEditor.jsx         # 文章编辑器；Markdown 写作、图片上传、专栏创建、发布动作
│   └── api.js                  # 后台 API 请求封装
├── components/
│   ├── Hero.jsx                # 首页头图；打字机效果、个人简介、CTA、事实卡片
│   ├── About.jsx               # 关于页主体；研究方向、可贡献能力、亮点卡片
│   ├── Projects.jsx            # 项目页；读取结构化项目数据渲染卡片，含 `/strategy/` 外链
│   ├── Blog.jsx                # 博客入口包装；转发到 BlogHub
│   ├── BlogHub.jsx             # 博客内容中枢；置顶、搜索、专栏、筛选、分页、项目命中
│   ├── BlogColumn.jsx          # 专栏页包装；按 `columnSlug` 复用 BlogHub
│   ├── BlogPost.jsx            # 博客详情页；读取运行时 JSON，渲染 TOC / 代码块 / LaTeX / 评论
│   ├── MarkdownContent.jsx     # 统一 Markdown 渲染器；GFM、数学公式、代码高亮、复制按钮
│   ├── GiscusComments.jsx      # Giscus 评论挂载
│   ├── Analytics.jsx           # GA4 页面访问统计（仅主站）
│   ├── Contact.jsx             # 联系页；强调研究匹配度与贡献方式，不公开占位社交链接
│   ├── Navbar.jsx              # 顶部导航；桌面/移动端菜单、语言切换、主题切换
│   └── Footer.jsx              # 页脚
├── context/
│   ├── ThemeProvider.jsx       # 主题状态；localStorage 持久化、`data-theme` 同步、theme-color 更新
│   ├── LocaleContext.jsx       # 语言状态；localStorage 持久化、`<html lang>` 同步
│   ├── useTheme.js             # 主题 hook
│   ├── useLocale.js            # 语言 hook
│   ├── themeContext.js         # ThemeContext 定义
│   └── localeContext.js        # LocaleContext 定义
├── data/
│   ├── blogSeed.js             # 博客初始种子内容；供本地 fallback 和后台 bootstrap 使用
│   └── projects.js             # 结构化项目数据；项目页渲染与搜索复用
└── lib/
    ├── site.js                 # 站点 surface / runtime / admin API 地址判定
    └── blog/
        ├── client.js           # 公开站点运行时 JSON 读取；远程失败时回退到本地 seed
        └── runtime.js          # 博客运行时构建逻辑；阅读时长、TOC、分页、搜索索引

server/
├── blog-admin/
│   └── api/                    # PHP/FPM 后台 API；GitHub OAuth、文章 CRUD、导入、上传、重建运行时
└── seeds/
    └── blog-runtime/           # 后台 bootstrap 用的运行时种子 JSON

public/
├── favicon.svg
└── vite.svg

nginx/
├── www.gfm156.com.conf         # 当前线上 HTTPS / SPA / `/strategy/` / `/blog-runtime` / `/blog-assets` 配置参考
├── www.gfm156.com.after-write-cutover.conf # `write.gfm156.com` 正式启用后，主站将 `/write` 重定向到子域的 nginx 配置
├── write.gfm156.com.bootstrap.conf # 子域证书尚未签发时使用的 HTTP bootstrap vhost
├── write.gfm156.com.conf       # 写作后台子域的 HTTPS / SPA / PHP-FPM 配置参考
└── gfm156.com.conf             # 旧版示例配置；root 指向旧路径，仅作历史参考

.cursor/
└── rules/
    └── ai-context-first.mdc    # Cursor 项目规则；先读 `AI_CONTEXT.md`，必要时回写

scripts/
├── build-blog-runtime.mjs      # 根据源文章生成公开运行时 JSON
└── activate-write-subdomain.mjs # 检查 DNS、申请子域证书、写入 GitHub OAuth 配置并切换正式子域的收口脚本

deploy.sh                       # Linux/macOS 部署脚本：build public/admin、上传 API 与 seed runtime，并按证书状态同步临时/正式 nginx 配置
deploy.bat                      # Windows 部署脚本：build public/admin、上传 API 与 seed runtime，并按证书状态同步临时/正式 nginx 配置
.env.example                    # 前端 env 示例（runtime base、Giscus、GA4、admin surface）
index.html                      # SEO meta、favicon、theme-color、Vite 入口
vite.config.js                  # Vite 配置（React + Tailwind v4）
README.md                       # 基础使用说明
UPDATE_2026-03-21.md            # 2026-03-21 全站重构说明
AI_CONTEXT.md                   # 本文件
dist/                           # 本地构建产物，不是源码
node_modules/                   # 依赖目录，不要手改
```

## 代码地图

### `src/main.jsx` — 应用入口
- 使用 `createRoot()` 挂载 React 19 应用
- Provider 顺序：`ThemeProvider` → `LocaleProvider` → `App`
- 全局样式入口为 `src/index.css`

### `src/App.jsx` — 路由与站点骨架
- 使用 `BrowserRouter`
- 先按 hostname 判断站点 surface：
  - `gfm156.com` / `www.gfm156.com` → 主站
  - `write.gfm156.com` → 写作后台
- 主站当前路由：
  - `/` → 首页（`Hero` + `About`）
  - `/projects`
  - `/blog`
  - `/blog/columns/:columnSlug`
  - `/blog/:slug`
  - `/contact`
  - `*` → 重定向到 `/`
- 后台当前路由：
  - `/` → 仪表盘
  - `/articles/new`
  - `/articles/:articleId`
- `ScrollToTop()` 在路由切换后平滑滚动到顶部
- `AnimatedOutlet()` 给页面切换添加 `route-transition` 动画
- 主站 `SiteLayout()` 统一包裹 `Navbar` / `Analytics` / `main` / `Footer`

### `src/context/ThemeProvider.jsx` — 明暗主题状态
- localStorage key：`steve-site-theme`
- 默认主题固定为 `light`
- 切换时同步：
  - `document.documentElement.dataset.theme`
  - `document.documentElement.style.colorScheme`
  - `<meta name="theme-color">`
- 对外暴露：`theme`、`isDark`、`setTheme()`、`toggleTheme()`

### `src/context/LocaleContext.jsx` — 双语状态
- localStorage key：`steve-site-locale`
- 默认策略：优先 localStorage，否则按浏览器语言推断 `zh` / `en`
- 切换时同步 `<html lang>`
- 对外暴露：`locale`、`isZh`、`setLocale()`、`toggleLocale()`

### `src/index.css` — 视觉系统与全局样式
- 直接 `@import "tailwindcss"`，没有单独的 `tailwind.config.*`
- 通过 `@theme` 定义站点级 token：字体、背景、卡片、边框、强调色
- 视觉方向是暖色学术风，不是默认黑白极简
- 包含：
  - `panel` / `chip` / `button-*` 等复用样式
  - `route-transition`、`liftIn`、`floatCard` 等动画
  - 博客富文本样式 `prose-blog`
  - `:root[data-theme="dark"]` 下的整套暗色覆盖

### `src/components/Hero.jsx` — 首页首屏
- 使用 `react-type-animation` 做研究方向打字机效果
- 中英双语文案都内联在组件内
- 含两组 CTA：项目页、博客页
- 事实卡片、能力亮点、学术背景都在这里首屏展示

### `src/components/About.jsx` — 关于模块
- 首页第二屏主体内容
- 组织方式：
  - 左侧：个人路径、项目经历、AI 工具链经验
  - 右侧：当前可贡献方向 + 当前目标
  - 底部：4 张重点卡片
- 双语 copy 同样内联在组件中

### `src/components/Projects.jsx` — 项目页
- 项目数据已抽到 `src/data/projects.js`
- 当前三类项目：
  - 量化金融数据分析 Web 应用
  - 航运模拟游戏
  - 本地 AI 工作流与部署实验
- 其中量化项目外链到 `https://gfm156.com/strategy/`

### `src/data/blogSeed.js` / `src/lib/blog/runtime.js` — 博客内容模型与运行时
- `blogSeed.js` 提供仓库内置的博客种子内容与专栏定义，既是本地 fallback，也是后台 bootstrap 的基础
- `runtime.js` 负责生成博客运行时数据：
  - 阅读时长
  - TOC
  - 置顶排序
  - taxonomies（专栏 / 标签 / 类型 / 语言）
  - 搜索索引
- 当前文章模型是一篇文章一种语言，不再依赖双语翻译对

### `src/components/BlogHub.jsx` — 博客内容中枢
- 公开站博客页不再读 `posts.js`，而是通过 `src/lib/blog/client.js` 读取运行时 JSON
- 当前能力：
  - 置顶文章
  - 搜索（博客文章 + 项目）
  - 按专栏 / 类型 / 标签 / 语言筛选
  - 分页
  - 专栏页复用
- 若远程 `/blog-runtime` 不可用，会回退到本地 seed runtime

### `src/components/BlogPost.jsx` — 博客详情页
- 根据路由参数 `slug` 加载单篇运行时 JSON
- 渲染能力：
  - `MarkdownContent.jsx`
  - GFM
  - LaTeX / KaTeX
  - 代码高亮与复制按钮
  - TOC
  - 上一篇 / 下一篇
  - Giscus 评论（配置完 env 后生效）
- 若运行时 JSON 不存在，显示“文章不可用”状态页

### `src/components/Navbar.jsx` — 导航与全局交互
- 桌面端与移动端菜单分别渲染
- 语言切换与主题切换都在导航中统一提供
- 根据滚动位置给 header 添加阴影和毛玻璃效果

### `src/components/Contact.jsx` — 联系页
- 刻意不展示占位邮箱 / GitHub / LinkedIn
- 页面重心是研究方向匹配度、可投入时间和可承担工作类型
- CTA 指向 `/projects` 和 `/blog`

## UI 设计护栏（重点，后续新增功能必须遵守）

### 设计定位
- 这个网站不是后台面板、SaaS 控制台，也不是通用作品集模板。
- 当前视觉方向是“暖色、学术感、编辑感、略带陈列式层次”的个人站。
- 后续 AI 如果新增功能，优先做成“内容型展示模块”或“轻交互组件”，不要把页面演化成仪表盘。

### 视觉基调
- 主背景不是纯白，而是暖米色系：`--color-bg: #f4efe7`
- 卡片不是纯平面白块，而是偏暖的半透明叠层：`--color-card: #fffaf4`
- 主文字不是纯黑：`--color-text: #221914`
- 主强调色是陶土橙：`--color-accent: #bf5a32`
- 第二强调色是蓝绿：`--color-accent-2: #3d8087`
- 高亮强调色是暖橙：`--color-accent-hi: #d4704a`
- 暗色主题不是简单反相，而是单独定义过的暖深色体系；新增 UI 不能只写亮色，不写暗色

### 字体与气质
- 正文字体：`Manrope`
- 展示字体：`Instrument Serif`
- 等宽字体：`JetBrains Mono`
- 页面气质依赖这套字体组合；不要随意换回默认系统字体，也不要引入科技感过强或花哨的展示字体
- 标题要保留一定杂志/编辑感，不能把所有标题都改成普通无衬线粗体

### 布局原则
- 页面基本骨架统一为：`section-shell` > `page-shell`
- 主要内容块优先使用 `panel` 容器，不要直接裸放一大片文本或按钮
- 布局倾向“宽松留白 + 2栏/卡片式分区”，不是高密度信息堆叠
- 新增 section 时，优先复用：`section-header`、`section-title`、`section-copy`、`panel`、`panel-hover`、`soft-surface`、`tint-surface`
- 移动端必须保持可读，不要新增只在桌面好看的复杂多列结构

### 组件风格约束
- 按钮优先复用 `button-primary` 和 `button-secondary`
- 标签优先复用 `chip`
- 小标题/辅助标签优先复用 `tiny-label` 或 `eyebrow`
- 图标容器优先复用 `icon-shell`
- 若新增卡片型功能，默认应先尝试 `panel` / `panel-hover`，而不是另起一套完全不同的卡片系统
- 不要在局部页面引入边角很硬、阴影很重、颜色很冷的组件样式

### 动效原则
- 当前动效是“轻微进入、浮动、路由过渡”，用于增强层次，不是为了炫技
- 可复用：`route-transition`、`animate-lift-in`、`float-card`
- 避免新增：夸张弹跳、高频闪烁、大幅旋转、明显分散注意力的连续动画

### 博客与文本展示约束
- Markdown 正文必须继续走 `prose-blog` 这套样式
- 不要为了某一篇文章单独写破坏全站一致性的富文本样式
- 文本内容整体应保持“清晰、克制、偏编辑写作”的观感，避免过度营销化文案包装

### 新增功能的接入方式
- 新功能优先作为现有页面中的一个 section 或 panel 接入，而不是突然引入一整套新 UI 框架
- 如果新增交互模块，先问自己是否能复用现有样式 token 和组件类；只有明显不够时才新增样式
- 如果必须新增样式，优先加到 `src/index.css` 的既有设计体系中，而不是在组件里写大量一次性风格
- 如果新增页面，必须同步考虑：导航项是否要加入 `Navbar`、页面首屏是否有 `section-header`、明暗主题是否都兼容、中英双语 copy 是否对齐

### 明确禁止的方向
- 不要引入 Material UI、Ant Design、shadcn 风格整套组件外观，除非用户明确要求重做视觉体系
- 不要把页面改成深紫、荧光蓝、赛博风、终端风
- 不要新增“后台表格 + 筛选器 + 指标卡 + 密集图表”的产品化 dashboard 视觉
- 不要使用默认系统蓝按钮、默认浏览器表单、纯黑白极简卡片来覆盖现有风格
- 不要让某个新功能看起来像是从另一个网站直接贴进来的

### 设计一致性检查清单
- 是否复用了现有颜色 token，而不是随手写了新的随机颜色
- 是否同时兼容 light / dark 两套主题
- 是否延续了暖色、柔和阴影、圆角、半透明叠层的整体语言
- 是否复用了已有按钮、卡片、标签、标题样式
- 是否在移动端仍保持整洁
- 是否和首页、项目页、博客页放在一起时看起来像同一个站

## 内容发布与维护

### 博客发布流程
1. 优先在 `write.gfm156.com` 后台直接写作、存草稿、上传图片、发布
2. 如需本地写作，则通过后台导入：
   - 1 个 Markdown 文件
   - 0 到多张相关图片
3. 后台 API 将文章写入 source storage，并重建公开运行时 JSON
4. 主站通过 `/blog-runtime` 读取最新已发布内容
5. 前端部署仍走 `deploy.sh` / `deploy.bat`，但不会覆盖线上内容库和 runtime 目录

### 常见改动落点
- 改站点路由：`src/App.jsx`
- 改全局样式或主题色：`src/index.css`
- 改主题逻辑：`src/context/ThemeProvider.jsx`
- 改语言逻辑：`src/context/LocaleContext.jsx`
- 改首页内容：`src/components/Hero.jsx`、`src/components/About.jsx`
- 改项目卡片：`src/components/Projects.jsx`
- 改博客 seed 内容：`src/data/blogSeed.js`
- 改博客运行时构建逻辑：`src/lib/blog/runtime.js`、`scripts/build-blog-runtime.mjs`
- 改博客读取逻辑：`src/lib/blog/client.js`
- 改博客列表 / 筛选 / 搜索：`src/components/BlogHub.jsx`
- 改博客详情渲染：`src/components/BlogPost.jsx`、`src/components/MarkdownContent.jsx`
- 改后台接口：`server/blog-admin/api/index.php`、`server/blog-admin/api/bootstrap.php`
- 改 SEO 标题 / 描述 / favicon / theme-color：`index.html`

## 运行方式

### 本地开发
```bash
npm install
npm run dev
```

### 常用命令
```bash
npm run build
npm run build:blog-runtime
npm run lint
npm run preview
```

### 重要事实
- 主站仍然是静态前端站点，但博客后台新增了 PHP/FPM API
- 公开博客内容优先从 `/blog-runtime` 读取；远程运行时不可用时，前端会回退到本地 seed
- 线上 source storage 与 runtime 目录应与 `dist/` 分离，避免常规部署覆盖内容
- `dist/` 仍然只是构建产物，任何长期修改都应回到 `src/`、`server/`、`nginx/` 或 seed 数据
- `/strategy/` 指向的是另一套独立服务，不属于本仓库构建产物；本仓库只负责主站导航、外链与 nginx 反向代理约定

## 部署信息
- GitHub 仓库：`https://github.com/rikka314/personal-website`；默认分支 `main`，HTTPS remote 名称为 `origin`
- Git 仅跟踪项目源码与部署模板；`node_modules/`、`dist/`、本地 `.env*`（保留 `.env.example`）及 `server/blog-admin/api/config.php` 不提交
- 线上域名：`https://gfm156.com`
- 后台域名：`https://write.gfm156.com`
- 服务器 IP：`115.191.68.122`
- 服务器环境：Ubuntu 24.04
- SSH 别名：`stratagy`（已配置免密登录）
- 主站根目录：`/www/wwwroot/www.gfm156.com`
- 后台根目录：`/www/wwwroot/write.gfm156.com`
- 博客 source storage：`/www/wwwdata/blog-source`
- 博客 public runtime：`/www/wwwdata/blog-runtime`
- nginx 可执行文件：`/www/server/nginx/sbin/nginx`
- 部署脚本行为：
  - 本地执行 `npm run build`
  - 本地执行 `npm run build:blog-runtime`
  - 上传 `dist/*` 到主站与后台根目录
  - 上传后台 API 到 `write.gfm156.com/api/`
  - 上传 bootstrap runtime 到 `write.gfm156.com/seeds/blog-runtime/`
  - 执行 `nginx -t && nginx -s reload`

### `/strategy/` 子项目部署（独立服务，不是本仓库主体）
- 线上访问入口：`https://gfm156.com/strategy/`
- 反向代理后端：`127.0.0.1:8501`
- 服务类型：systemd 服务
- 服务名：`stratagy`
- 服务目录：`/opt/stratagy`
- 最小部署内容：`app.py`、`core/`、`ui/`
- 部署命令：
```bash
scp -r app.py core/ ui/ stratagy:/opt/stratagy/
ssh stratagy "systemctl restart stratagy"
```
- 查看日志：
```bash
ssh stratagy "journalctl -u stratagy -n 50 --no-pager"
```
- 注意：这些命令适用于独立的 `/strategy/` 服务，不适用于本仓库的主站 / 博客后台整体部署

### 部署命令
```bash
bash deploy.sh
```

或 Windows：
```bat
deploy.bat
```

### nginx 约定
- 主站是 React SPA，所有前端路由都要 `try_files ... /index.html`
- 主站新增：
  - `/blog-runtime/` → public runtime 目录
  - `/blog-assets/` → source storage 中的公开图片目录
- `/strategy/` 不是本项目静态资源，而是反向代理到 `127.0.0.1:8501`
- `/strategy/` 后端对应另一套独立 Python/systemd 服务，部署与重启流程不走本仓库的 `deploy.sh` / `deploy.bat`
- 后台子域 `write.gfm156.com` 也走 SPA，但 `/api/` 要交给 PHP/FPM
- `nginx/www.gfm156.com.conf` 是当前临时 `/write` 回退仍在线时的主站配置
- `nginx/www.gfm156.com.after-write-cutover.conf` 是子域正式启用后主站 `/write` 重定向的配置
- `nginx/write.gfm156.com.bootstrap.conf` 用于子域 DNS 已就绪但证书尚未签发时的 HTTP bootstrap vhost
- `nginx/write.gfm156.com.conf` 是写作后台子域的正式 HTTPS / SPA / PHP-FPM 配置
- `nginx/gfm156.com.conf` 中的 `root /var/www/personal-website;` 已经过时，不应再作为实际部署依据

## 当前项目状态（2026-03-21）
- 已从单页长滚动站重构为基于路由的多页面站点
- 当前有效页面：
  - `/`
  - `/projects`
  - `/blog`
  - `/blog/columns/:columnSlug`
  - `/blog/:slug`
  - `/contact`
- 已新增写作后台：
  - `write.gfm156.com`
  - `/`
  - `/articles/new`
  - `/articles/:articleId`
- 站点内容已切换到当前的 CUHK-Shenzhen AI 本科生画像
- `Skills` 区块已移除
- 假邮箱、假 GitHub、假 LinkedIn 等占位链接已移除
- 博客已从“静态 Markdown + posts.js 登记”升级为完整内容系统：
  - 主站读运行时 JSON
  - 后台支持 GitHub OAuth、写作、导入、上传、发布
  - 项目搜索已并入博客搜索范围
- 暖色主题、双语切换、移动端导航都已落地
- 当前代码已通过本地验证：
  - `npm run build:blog-runtime`
  - `npm run build`
  - `npm run lint`
- 截至 `2026-03-21`，本次博客系统升级尚未实际发布到服务器
- 已增加项目级 AI 协作约定：进入本仓库后优先阅读 `AI_CONTEXT.md`，若任务改变项目级事实，再酌情更新该文件

## 修改须知
1. 这是内容驱动型站点，很多 copy 直接内联在组件里；改文案时先确认是 `en`、`zh` 还是两者都要同步。
2. 当前博客系统依赖“source storage + public runtime JSON + 写作后台”三层结构：
   - 主站读 `/blog-runtime`
   - 后台写 `storage_root`
   - 发布后重建运行时 JSON
   任一层改动都要检查另外两层是否仍兼容。
3. UI 是一级约束，不是最后再补；任何新增功能都必须先对照上面的“UI 设计护栏”检查兼容性。
4. 新增页面时，通常需要同时改：
   - `src/App.jsx` 路由
   - `src/components/Navbar.jsx` 导航项
   - 可能还要补 `Footer.jsx` 或首页 CTA
5. 若修改主题机制，要验证：
   - localStorage 持久化
   - `data-theme` 是否同步
   - `meta[name="theme-color"]` 是否同步
6. 若修改语言机制，要验证：
   - localStorage 持久化
   - `<html lang>` 是否同步
   - 语言切换是否只影响界面文案，而不误过滤博客文章
7. 若改部署流程，以 `deploy.sh` / `deploy.bat` 和 `nginx/www.gfm156.com.conf` 为准，不要参考旧路径 `/var/www/personal-website`
8. Cursor 在本仓库中会通过 `.cursor/rules/ai-context-first.mdc` 优先读取本文件；Codex 侧应使用 `ai-context-sync` skill 执行相同流程
9. 每次会话开始时，先阅读本文件；若本次任务改变了项目级事实（架构、部署路径、发布方式、文档约定、关键页面结构、UI 体系等），应同步更新本文件，保证其长期有效
## 2026-03-21 Deployment Update
- `deploy.sh` / `deploy.bat` now use the SSH alias `stratagy` instead of a hard-coded `root@IP`.
- The deploy scripts now upload:
  - public/admin `dist/*`
  - `server/blog-admin/api/*`
  - `server/seeds/blog-runtime/*` to both `write.gfm156.com/seeds/blog-runtime` and `/www/wwwdata/blog-runtime`
  - the minimal runtime-builder bundle used by the PHP admin to rebuild public blog JSON:
    - `package.json`
    - `scripts/build-blog-runtime.mjs`
    - `src/data/blogSeed.js`
    - `src/data/projects.js`
    - `src/lib/blog/runtime.js`
  - `nginx/www.gfm156.com.conf`
- The server now has `nodejs 18.x` installed so `rebuild_public_runtime()` can run on-host.
- Actual live deployment status as of `2026-03-21`:
  - `https://gfm156.com` is deployed.
  - `https://gfm156.com/blog-runtime/index.json` and `/search.json` are live.
  - `/www/wwwdata/blog-source` has been initialized from seed content.
  - `/www/wwwroot/write.gfm156.com` now contains the admin SPA, PHP API, seeds, and runtime-builder files.
- Not fully finished yet:
  - `write.gfm156.com` is not publicly enabled yet because the subdomain certificate / nginx site activation is still missing.
  - GitHub OAuth secrets are still not configured, so admin sign-in is not available yet.
- BaoTa / PHP note:
  - the real PHP entry for this host is the unix socket `unix:/tmp/php-cgi-82.sock`
  - `nginx/write.gfm156.com.conf` was updated to match that socket instead of `127.0.0.1:9000`
- Temporary live admin fallback on `2026-03-21`:
  - because `write.gfm156.com` still has no public DNS/TLS, the writing surface is temporarily exposed at `https://gfm156.com/write/`
  - `src/lib/site.js` and `src/App.jsx` now support an `admin-path` surface under `/write`
  - `nginx/www.gfm156.com.conf` now routes `/write/api` directly to `/www/wwwroot/write.gfm156.com/api/index.php` through PHP-FPM; do not serve admin API via static `try_files`
  - the public blog hub includes a direct CTA to `/write/`
- Temporary auth fallback on `2026-03-21`:
  - `/www/wwwroot/write.gfm156.com/api/config.php` now exists on the server with `app_base_url = https://gfm156.com/write`
  - GitHub OAuth is still pending, so the live admin currently uses a single-user password fallback instead
  - live smoke tests confirmed `/write/` loads, `/write/api/session` returns JSON, password login succeeds, and `/write/api/articles` returns the seeded article list
- Public surface note on `2026-03-21`:
  - the `Contact` page is currently hidden from the live site while its content direction is still undecided
  - `src/components/Contact.jsx` remains in the repo, but `src/App.jsx` no longer exposes `/contact` and `src/components/Navbar.jsx` no longer shows a contact nav item
  - the About-page highlight card for quantitative work now describes self-studied basic quantitative strategy knowledge and simple-factor evaluation ability instead of coursework grades
## 2026-03-22 Write Subdomain Cutover Prep
- `deploy.sh` / `deploy.bat` now create the BaoTa `write.gfm156.com` include paths if needed and sync nginx differently based on certificate state:
  - if `/etc/letsencrypt/live/write.gfm156.com` is missing, deploy keeps the current `/write` fallback on the main site and uploads `nginx/write.gfm156.com.bootstrap.conf`
  - once the subdomain certificate exists, deploy automatically uploads `nginx/write.gfm156.com.conf` and `nginx/www.gfm156.com.after-write-cutover.conf`
- `scripts/activate-write-subdomain.mjs` was added as the one-shot production cutover entry:
  - verifies that `write.gfm156.com` resolves to `115.191.68.122` from the server side
  - installs the bootstrap vhost
  - runs `certbot` for `write.gfm156.com`
  - writes `/www/wwwroot/write.gfm156.com/api/config.php` with GitHub OAuth and clears the temporary password hash
  - switches the main-site `/write` path to a redirect that targets `https://write.gfm156.com/`
- Backend auth hardening added in `server/blog-admin/api/bootstrap.php` / `index.php`:
  - session cookies now use `HttpOnly`, `SameSite=Lax`, and conditional `Secure`
  - once GitHub OAuth is configured, password auth is treated as disabled so the UI does not keep exposing a dead password button
  - stale `local-admin` sessions are dropped automatically after the OAuth cutover
- Live state observed on `2026-03-22`:
  - `write.gfm156.com` is still `NXDOMAIN` from real public DNS (`dig @223.5.5.5`)
  - `/www/server/panel/vhost/nginx/write.gfm156.com.conf` and `/etc/letsencrypt/live/write.gfm156.com` were both still absent on the server before this prep work
  - `/www/wwwroot/write.gfm156.com/api/config.php` on the server still points to `https://gfm156.com/write`, has a password hash, and has no GitHub OAuth client credentials yet
## 2026-03-25 Blog Reset + Auth Update
- `src/data/blogSeed.js` now ships with zero seed articles; `server/seeds/blog-runtime` therefore boots the public blog as an intentionally empty archive by default.
- `scripts/build-blog-runtime.mjs` now treats an existing-but-empty source library as a valid `storage-empty` state and builds a 0-article runtime instead of throwing an error.
- `server/blog-admin/api/bootstrap.php` now bootstraps source storage only once via `/www/wwwdata/blog-source/.initialized` (or the local equivalent); deleting all articles no longer causes the seed content to be re-imported on the next request.
- `src/lib/blog/client.js` now only falls back to local seed runtime during local dev or when `VITE_BLOG_RUNTIME_LOCAL_FALLBACK=true`; production now surfaces runtime load failures instead of silently reviving seed content.
- GitHub OAuth now only requires `github_client_id` + `github_client_secret`; `github_allowed_logins` is optional, and an empty allowlist means any GitHub account may sign in and publish. Legacy `github_allowed_login` is still accepted for backward compatibility.
- `scripts/activate-write-subdomain.mjs` and `server/blog-admin/api/config.example.php` now write/read `github_allowed_logins` arrays so the production cutover can support open publishing without hard-coding one GitHub username.
- `server/blog-admin/api/bootstrap.php` now also tolerates mistakenly array-shaped legacy `github_allowed_login` values instead of warning and rejecting the user.
- While the temporary `/write` fallback remains on the main site, the SPA now canonicalizes `https://www.gfm156.com/write/...` to `https://gfm156.com/write/...` before GitHub OAuth starts, so the callback/state flow stays on one host.
- `nginx/www.gfm156.com.conf` now also redirects `www.gfm156.com/write...` to `gfm156.com/write...` server-side during the temporary `/write` phase, so OAuth state does not get split across hosts before the SPA loads.
- The shipping simulation project card now points to `https://github.com/rikka314/AIE-shipgame`.

## 2026-09-06 Server Configuration Baseline
- `nginx/www.gfm156.com.conf` is an exact copy of the server's current main-site configuration at `/www/server/panel/vhost/nginx/www.gfm156.com.conf`.
- The live `/strategy` entry redirects to `/strategy/` while preserving query parameters. Its proxy uses `http://127.0.0.1:8501` without a trailing slash, preserving the `/strategy/` path expected by the backend; buffering and proxy redirects are disabled.
- The main-site nginx configuration also exposes the independent Predictor service through `/predictor/`, forwarding to `127.0.0.1:8503`; `/predictor` redirects to `/predictor/`. This service is not part of this project's frontend build.
- The write-subdomain certificate is still absent at this baseline. The active deployment branch uses `nginx/www.gfm156.com.conf` and `nginx/write.gfm156.com.bootstrap.conf`, with the admin available through the main site's `/write/` route.
- `nginx/www.gfm156.com.after-write-cutover.conf` and `nginx/write.gfm156.com.conf` remain future cutover templates, not snapshots of the active configuration. Before activating the subdomain, carry the current `/strategy/` and `/predictor/` proxy rules into the main-site cutover template.
