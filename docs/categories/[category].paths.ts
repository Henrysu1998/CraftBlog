// [category].paths.ts —— 分类页动态路由的「参数来源」。
// VitePress 遇到 docs/categories/[category].md 这个带方括号的文件名时，
// 会去同目录找同名 .paths.ts，调用它导出的 paths()，
// 拿到所有分类名，为每个分类生成一个独立页面（如 /categories/教程）。
//
// 以后新增一个分类，不需要改这里的代码：只要给文章写上 categories 分类，
// 这里扫描文章时会自动发现新分类并生成对应页面。

import fs from 'node:fs'
import path from 'node:path'
// 共用的分类提取函数：和 config.mts 用同一份，保证「哪些分类存在」的判断一致
import { extractCategories } from '../.vitepress/posts-utils.js'

export default {
  // paths()：返回所有需要生成的分类页参数。
  // 返回值是数组，每一项代表一个分类页；params 里的 category 就是 URL 里的分类名。
  // 比如 { params: { category: '教程' } } 会生成 /categories/教程 这个页面。
  paths() {
    // docs 源码目录。脚本从项目根目录运行（vitepress dev docs / vitepress build docs），
    // 所以是「根目录 + docs」。
    const docsDir = path.resolve(process.cwd(), 'docs')

    // Set 是「不重复的集合」：同一个分类多篇文章都写过，只算一次
    const categorySet = new Set<string>()

    // 扫描 docs/ 下的所有文章（.md，跳过首页 index.md）。
    // 注意：和 config.mts 一样，目前只看 docs/ 顶层，不递归子目录。
    fs.readdirSync(docsDir)
      .filter((f) => f.endsWith('.md') && f !== 'index.md')
      .forEach((file) => {
        // 读文件源码，提取这篇文章写了哪些分类
        const src = fs.readFileSync(path.join(docsDir, file), 'utf8')
        const cats = extractCategories(src)
        // 没写分类的文章也归入「未分类」，保证它始终有分类页可以展示
        ;(cats.length ? cats : ['未分类']).forEach((cat) => categorySet.add(cat))
      })

    // 转成 VitePress 要求的参数数组，并按分类名排序，保证生成的页面顺序稳定
    return [...categorySet]
      .sort((a, b) => a.localeCompare(b))
      .map((category) => ({ params: { category } }))
  },

  // transformPageData：VitePress 在每个分类页「生成数据」时调用，
  // 在这里把页面标题设成分类名（如「教程」）。
  // 不这么做的话，页面标题会显示成 {{ 分类名 }} 的字面量（markdown 模板插值
  // 发生在标题推断之后，推断时还没渲染，取到的是原始模板文本）。
  transformPageData(pageData) {
    // pageData.params 里有当前分类名，pageData.title 是浏览器标签页/顶部显示的标题
    pageData.title = pageData.params.category
  },

  // watch：开发时 VitePress 会监听这些文件，一旦变化就重新调用 paths()。
  // '../*.md' 是相对本文件所在目录（docs/categories/），也就是 docs/*.md ——
  // 以后新增/删除文章时，分类页会自动跟着变，不用重启开发服务器。
  watch: ['../*.md', '../.vitepress/posts-utils.ts']
}
