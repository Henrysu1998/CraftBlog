# 变更日志（Changelog）

本文件记录博客网站的主要变更，按日期倒序排列。  
每条格式：日期（YYYY-MM-DD）→ 变更点 → 实现手段。

---

## 2026-09-01

### 新增分类功能（文章分类体系）

- 之前站点没有任何分类，侧边栏把 `docs/` 下所有文章平铺在一个「文章」分组里，首页也没有分类入口
  - 手段：每篇文章的 frontmatter 加 `categories` 字段标记分类（支持单个 `categories: 教程` 和多个 `categories: [教程, 部署]` 两种写法，没写分类的文章自动归入「未分类」）；在共用工具文件 `docs/.vitepress/posts-utils.ts` 新增 `extractCategories()` 解析函数，侧边栏、分类页和首页标签用同一份解析规则，保证分类判断一致
- **侧边栏改为按分类显示**：不再平铺文章，改为列出分类名称，点击分类名进入对应分类页
  - 手段：重写 `config.mts` 的 `buildSidebar()`，扫描 `docs/*.md` 收集所有分类，返回 `[{ text: 分类名, link: '/categories/分类名' }]` 列表
- **每个分类一个独立页面**（如 `/categories/教程`），列出该分类下的全部文章
  - 手段：用 VitePress 动态路由，新增 `docs/categories/[category].md` 模板 + `docs/categories/[category].paths.ts`（扫描文章自动发现分类并生成页面）+ `CategoryPage.vue` 文章列表组件；用 `transformPageData` 把页面标题设成分类名，避免标题显示成 `{{ $params.category }}` 字面量
- **首页底部分类标签**：在文章书架下方新增一排分类标签，显示分类名和文章数，点击进入对应分类页
  - 手段：新增 `categories.data.ts`（用 `createContentLoader` 按分类聚合文章）+ `CategoryTags.vue`，在 `Layout.vue` 的 `home-features-after` 插槽中放在书架之后
- 以后新增文章只需在 frontmatter 写 `categories`，无需改代码：分类页通过 `watch` 监听 `docs/*.md` 自动重新生成，侧边栏构建时自动刷新
- 修复：分类页模板被当成普通文章混进首页书架
  - 原因：`[category].md` 也会被 `createContentLoader('**/*.md')` 扫到，被当成文章卡片
  - 手段：在 `theme/posts.data.ts` 的 `transform` 里过滤掉 `url` 以 `/categories/` 开头的页面
- 修复：frontmatter 里的 `#` 注释被误读成文章标题
  - 原因：`extractFirstHeading()` 用正则找第一个 `#` 标题时，把 frontmatter 配置块里以 `#` 开头的注释行也当成了标题
  - 手段：匹配标题前先剥掉开头的 frontmatter 配置块

### 移除首页 hero 按钮，分类标签改为按钮样式

- 首页原本通过 hero.actions 配置有两个按钮（Markdown Examples / API Examples），用户要求去掉这两个按钮，并让底部分类标签复刻它们的按钮格式
  - 手段：删除 `docs/index.md` 里的 `actions:` 配置；`Layout.vue` 移除 `<HeroActions />` 及其隐藏样式；删除不再使用的 `HeroActions.vue`
  - 分类标签复刻 hero 按钮的「空心（alt）主题」格式并放大一档（big 尺寸）：重写 `CategoryTags.vue` 的样式，改为空心描边按钮（圆角 24px、高 46px、字号 16px、字重 600），去掉原来的 ↗ 图标和胶囊描边样式，只保留「分类名 + 文章数」
- 验证：`docs:build` 构建通过，生成 `教程 / 示例 / 部署` 三个分类页；首页产物里两个 hero 按钮已消失、三个分类按钮带正确链接和计数

---

## 2026-08-30

### 新增示例文章，让首页书架左右对称

- 之前站点只有 2 篇文章，`visibleCount = Math.min(2*sideCount+1, total)` 算出 2，书架上只在左侧露出一本书，构图不平衡，看起来像按钮和中间卡片没对齐
  - 手段：临时新增 `docs/sample-post.md` 凑成奇数 3，书架显示 k = -1 / 0 / +1，左右各一本书，对称；之后示例文章被删，换成用户自己的 `docs/vitepress-githubPage.md`，总数仍是 3
- 备注：书架要左右对称，文章总数需为奇数（3、5、7…）；偶数总数时当前布局仍是「左边多一本」

### 侧边栏自动生成（不用再手动改 config.mts）

- 之前每新增一篇文章，都要手动在 `config.mts` 的 `sidebar` 数组里加一条链接
  - 手段：新增 `buildSidebar()` 函数，用 Node 的 `fs` 扫描 `docs/` 目录下所有 `.md`（跳过首页 `index.md`），自动生成侧边栏分组
- 标题自动提取：优先用 frontmatter 的 `title`，否则用正文第一个 `#` 标题
  - 手段：新增共用工具文件 `docs/.vitepress/posts-utils.ts`（`extractTitle` / `extractFirstHeading`），`config.mts` 和 `theme/posts.data.ts` 都从它导入，保证侧边栏和首页卡片的标题规则一致
- 安装 `@types/node`（开发依赖）：让 `config.mts` 里 `import fs from 'node:fs'` 不再报编辑器类型错误
- 局限：目前只扫描 `docs/` 顶层，不递归子目录；以后文章多了要分目录，再扩展成按目录分组

### 文章插图验证（相对路径自动加 base 前缀）

- 确认 md 里可以插入图片并随 GitHub Pages 一起上线
  - 手段：新建 `docs/images/` 文件夹放图片，md 里用相对路径引用 `![说明](./images/xxx.png)`
  - 构建时 VitePress 自动把图片拷到产物 `assets/` 并加上 `/CraftBlog/` 前缀（实测 `<img src="/CraftBlog/assets/test-image.xxx.png">`），图片在 `/CraftBlog/` 子路径下也能正常显示
- 测试图：`docs/images/test-image.png`（600×400 渐变图，脚本生成）；已插入 `docs/vitepress-githubPage.md` 演示

### 修复首页卡片预览里的图片不显示

- 现象：文章正文有图片时，首页书架卡片的文章预览里，图片显示不出来（破图）
  - 原因：文章里图片用的是相对路径（如 `./images/xxx.png`），相对路径是「相对于文章页所在位置」的，文章页能正常显示；但首页卡片用 `v-html` 直接把文章 HTML 塞进首页，浏览器拿首页地址去解析相对路径，找不到文件（构建产物里图片被 VitePress 打到了带哈希的 `assets/` 目录），于是 404
  - 手段：在 `theme/posts.data.ts` 新增 `fixImagePaths()`，把文章 HTML 里以 `./` / `../` 开头的图片路径重写成带 base 前缀的绝对路径（如 `/CraftBlog/images/xxx.png`），`html` 和 `excerpt` 两个字段都处理；在 `config.mts` 新增 `buildEnd` 钩子，构建完成后把 `docs/images/` 原样复制到 `dist/images/`，让重写后的路径能真正访问到图片文件
- 验证：`docs:build` 产物里 `dist/images/` 含全部图片，首页数据里的图片路径已变为 `/CraftBlog/images/xxx.png`；`docs:preview` 与 `docs:dev` 下图片 URL 均返回 200；文章详情页不受影响（仍走哈希后的 `assets/` 路径）

### 首页横向文章列表（书架式卡片）

- **移除默认首页的 features 三栏占位卡片**（原会占掉空间、把横向列表挤到屏幕外）
  - 手段：删除 `docs/index.md` 里的 `features:` 配置块
- **新增横向文章列表组件 `PostCarousel.vue`**
  - 手段：自定义主题，在 `docs/.vitepress/theme/Layout.vue` 里用默认主题的 `#home-features-after` 插槽插入该组件
- **布局改为「书架左右排列」**：当前文章一张完整卡片居中展示，左右两侧各露出非当前文章，缩小并往后退
  - 手段：外层 `.card-pos` 定位层负责居中/缩放/层次（`transform: translateX(-50%) scale()`），内层 `.card` 负责内容；`transform-origin: bottom center` 让两侧的书底对齐，像书架
- **翻页交互：左右箭头按钮**，并做成**环形列表**（首尾相连：第一篇往左绕到最后一篇，最后一篇往右绕回第一篇）
  - 手段：`current` 用取模 `% total` 循环推进；`visibleCount = Math.min(2 * sideCount + 1, total)` 限制同时显示张数，避免文章总数少时重复出现
- **卡片显示文章的缩小版预览**（标题 + 日期 + 文章内容开头）
  - 手段：`posts.data.ts` 开启 `render: true` 生成文章完整 HTML 放进数据；卡片内用 `v-html` 渲染，配合 CSS 限高 + 底部渐隐做成「迷你版」效果
- **修复点卡片标题无法跳转文章的问题**
  - 原因：旧实现用 `setPointerCapture` 做拖拽滚动，会把 click 事件劫持到容器而不是卡片链接上
  - 手段：移除整套拖拽/指针捕获逻辑，标题改为 `<a>` 链接跳转
- **修复文章链接 404**
  - 原因：`posts.data` 返回的 `url` 不带 `/CraftBlog/` base 前缀，直接当链接会跳到错误路径
  - 手段：所有跳转链接统一用 VitePress 的 `withBase()` 补前缀

### 顶部按钮下移到横向列表下方

- 把 `hero.actions` 按钮从 hero 顶部挪到横向文章列表下方
  - 手段：新增 `HeroActions.vue`，用 `useData()` 读取 `index.md` 里的 `hero.actions` 配置并渲染；在 `Layout.vue` 的 `home-features-after` 插槽中放在 `PostCarousel` 之后；用一条全局样式 `.VPHero .actions { display: none }` 隐藏默认 hero 里的那份，避免重复

### 消除编辑器类型误报

- `import { data as posts } from '../posts.data'` 被编辑器报「没有导出 data」
  - 原因：`data` 是 VitePress 构建时才注入的具名导出，源码里只有 `export default createContentLoader(...)`，编辑器静态检查看不到
  - 手段：import 前加 `// @ts-expect-error` 并注释说明（不影响构建/运行）；新增 `docs/.vitepress/env.d.ts` 声明 `.vue` 模块类型

---

## 2026-08-29

- **搭建自定义主题结构**：新增 `docs/.vitepress/theme/`（`index.ts`、`Layout.vue`、`posts.data.ts`），为插入首页横向文章列表做准备
- **新增 `tsconfig.json`**：启用 TypeScript 类型检查（include `docs/.vitepress/**`）
- **补充注释**：`config.mts` 和 `index.md` 加入中文注释说明各部分作用；去掉首页 hero 的副标题

---

## 2026-08-28

- **用 VitePress 创建案例站点**（首页 + markdown/api 示例页）
- **配置 GitHub Pages 自动部署**
  - 手段：新增 GitHub Actions `deploy.yml`
  - 部署分支改为 `master`
  - 改用 `pnpm` 安装依赖并构建部署
- **修复 GitHub Pages 静态资源路径**
  - 原因：部署到 `https://<用户名>.github.io/CraftBlog/` 子路径下，打包后的 `/assets/...` 绝对路径会找不到文件
  - 手段：在 `config.mts` 配置 `base: '/CraftBlog/'`
