// categories.data.ts —— 「数据加载器」：构建时把所有文章按分类分组。
// 用途：
//   - 首页底部的分类标签（CategoryTags.vue）靠它知道有哪些分类、每类几篇文章
//   - 每个分类页（CategoryPage.vue）靠它知道该分类下有哪些文章
// 文件名必须以 .data.ts 结尾，VitePress 才会在构建时注入 data 导出，
// 组件里用 `import { data as categories } from '../categories.data'` 就能拿到。

import { createContentLoader } from 'vitepress'
// 共用的标题提取函数：和 posts.data.ts、config.mts 用同一份，保证标题规则一致
import { extractFirstHeading } from '../posts-utils.js'

// 把 frontmatter 里的 categories 字段统一成「字符串数组」。
// frontmatter 经过 YAML 解析后可能是这几种样子：
//   字符串  "教程"            → 单个分类，要包成数组 ["教程"]
//   数组    ["教程", "部署"]   → 已经是数组，直接用
//   其它（没写、写了别的）      → 返回空数组
function toArray(cat: unknown): string[] {
  if (Array.isArray(cat)) return cat.map((item) => String(item))
  if (typeof cat === 'string' && cat.trim()) return [cat.trim()]
  return []
}

export default createContentLoader('**/*.md', {
  // includeSrc：把每篇 markdown 的「原始源码」也带上，提取标题兜底时要用到
  includeSrc: true,

  // transform：拿到原始数据后，加工成「按分类分组」的结构，最后返回的就是这个结果
  transform(raw) {
    // Map 是一种「键值对」容器：分类名 → 该分类下的文章数组。
    // 用它的好处：一篇文章属于多个分类时，能同时挂到多个分类下。
    const groups = new Map<string, { title: string; url: string; date: string | null }[]>()

    raw
      // 过滤掉首页（url 是 '/'）和分类页自身（url 以 /categories/ 开头）。
      // 分类页 [category].md 也会被这个加载器扫到，不排除的话会被当成普通文章混进来。
      .filter((page) => page.url !== '/' && !page.url.startsWith('/categories/'))
      // 把每篇文章分到它所属的分类里
      .forEach((page) => {
        // 分类可能是一个字符串或数组，统一成数组；没写分类就归入「未分类」
        const cats = toArray(page.frontmatter.categories)
        const finalCats = cats.length ? cats : ['未分类']

        // 这篇文章在分类列表里要展示的信息
        const post = {
          // 标题：优先 frontmatter 里的 title，否则从正文第一个 # 标题兜底
          title: page.frontmatter.title || extractFirstHeading(page.src),
          // 文章链接（不带 base 前缀，跳转时组件里用 withBase 补上）
          url: page.url,
          // 日期（可能没有，允许 null）
          date: page.frontmatter.date ?? null
        }

        // 把同一篇文章挂到它所有的分类名下
        finalCats.forEach((cat) => {
          if (!groups.has(cat)) groups.set(cat, [])
          groups.get(cat)!.push(post)
        })
      })

    // 把 Map 转成 [{ name, posts }] 数组并排序，保证显示顺序稳定：
    //   分类之间按名称排序；分类内的文章按日期倒序（新文章在前），没日期的按链接排。
    return [...groups.entries()]
      .map(([name, posts]) => ({
        name,
        posts: posts.sort(
          (a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.url.localeCompare(b.url)
        )
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
})
