# 变更日志（Changelog）

本文件记录博客网站的主要变更，按日期倒序排列。  
每条格式：日期（YYYY-MM-DD）→ 变更点 → 实现手段。

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
