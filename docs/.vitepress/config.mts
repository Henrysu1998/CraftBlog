import { defineConfig } from 'vitepress'
// Node 内置模块：fs 读文件、path 拼路径（自动生成侧边栏用）
import fs from 'node:fs'
import path from 'node:path'
// 文章工具函数：从 markdown 源码里提取标题
import { extractTitle } from './posts-utils.js'

// 自动生成侧边栏：扫描 docs/ 目录下的所有 .md 文章（首页 index.md 除外），
// 标题优先用 frontmatter 的 title，否则用正文第一个 # 标题。
// 以后新增文章，只要把 .md 文件放进 docs/，侧边栏会自动出现，不用再改这里。
// 注意：目前只扫描 docs/ 顶层（不递归子目录）。
function buildSidebar() {
  // docs 源码目录。脚本总是从项目根目录运行（package.json 里的
  // vitepress dev docs / vitepress build docs），所以是「根目录 + docs」。
  const docsDir = path.resolve(process.cwd(), 'docs')

  // 收集每篇文章的 { 标题, 链接 }。
  const items = fs
    .readdirSync(docsDir)                                    // 列出 docs/ 下的所有文件
    .filter((f) => f.endsWith('.md') && f !== 'index.md')    // 只要 .md，跳过首页
    .map((file) => {
      // 读文件源码，提取标题
      const src = fs.readFileSync(path.join(docsDir, file), 'utf8')
      // 链接：去掉 .md 后缀、前面加 /（如 sample-post.md -> /sample-post）
      return {
        text: extractTitle(src),
        link: '/' + file.replace(/\.md$/, '')
      }
    })
    // 按链接排序，保证显示顺序稳定（不受文件系统顺序影响）
    .sort((a, b) => a.link.localeCompare(b.link))

  // 返回一个分组：分组标题「文章」，下面是所有文章的链接
  return [{ text: '文章', items }]
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // 站点部署的基础路径。
  // 部署在 GitHub Pages 上且仓库名为 CraftBlog，所以必须设成 /CraftBlog/，
  // 否则打包后引用 css/js 等资源的绝对路径 /assets/... 会找不到文件。
  // 本地开发时若设为 / 会更方便，部署前再改回来。
  base: '/CraftBlog/',

  // 站点标题：显示在浏览器标签页、导航栏 logo 处，也用于 SEO
  title: "橘子不爱吃番茄酱",

  // 站点描述：注入到 <meta name="description">，用于 SEO 和分享摘要
  description: "吃完饭就胡言乱语",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    // 顶部导航栏，从左到右渲染每一项。
    // text：显示文字；link：点击跳转的路径（/ 表示首页）
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    // 侧边栏：现在由上面的 buildSidebar() 自动生成，
    // 以后新增文章，不需要再手动维护这里的列表。
    sidebar: buildSidebar(),

    // 右上角社交图标。icon 为内置图标名（github / twitter / discord 等），
    // link 为跳转地址
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})