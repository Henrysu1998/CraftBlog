// posts.data.ts —— 「数据加载器」，负责在构建时收集所有文章的信息。

// createContentLoader 是 VitePress 提供的方法：给它一个文件匹配规则（glob），
// 它会在构建时读取这些文件，把每篇文章的信息整理成数组。
import { createContentLoader } from 'vitepress'
// 共用的标题提取函数：和 config.mts 用同一份，保证标题规则一致
import { extractFirstHeading } from '../posts-utils.js'

// 文件名必须以 `.data.ts` 结尾，这是 VitePress 的约定：
// 它会识别这个文件，并在构建时注入一个 `data` 导出（文章数组），
// 组件里用 `import { data } from './posts.data'` 就能拿到。
export default createContentLoader('**/*.md', {
  // includeSrc: 把每篇 markdown 的「原始源码」也带上。
  // 之后提取标题兜底时要用到源码。
  includeSrc: true,

  // render: true —— 把每篇文章的 markdown 渲染成「完整 HTML」放进数据里。
  // 首页卡片靠它显示文章的缩小版预览；不开的话 page.html 是空的。
  render: true,

  // excerpt: 提取文章摘要（渲染成 HTML）。true 表示用默认分隔符截取，
  // 文章里没写分隔符时摘要为空。这里保留字段备用，卡片预览用的是 html。
  excerpt: true,

  // transform: 拿到原始数据后，加工成我们需要的字段，最后返回的就是这个结果。
  // 这里用到了两个数组方法：
  //   filter —— 过滤：只留下满足条件的项
  //   map    —— 映射：把每一项转成新的对象
  transform(raw) {
    return (
      raw
        // 过滤掉首页。index.md 的 url 是 '/'，不放进文章列表。
        .filter((page) => page.url !== '/')
        // 把每篇文章整理成 { title, url, date, excerpt, html } 结构。
        .map((page) => ({
          // 标题优先用 frontmatter 里写的 title；
          // 没写就用 extractFirstHeading() 从正文提取第一个 # 标题兜底。
          title: page.frontmatter.title || extractFirstHeading(page.src),

          // 文章链接地址。
          url: page.url,

          // 日期。`??` 是「空值合并」：左边是 null/undefined 时才用右边的 null，
          // 它和 `||` 的区别是：0、'' 这些值 ?? 不会替换，只替换 null/undefined。
          date: page.frontmatter.date ?? null,

          // 摘要，没提取到就给空字符串（备用字段）。
          excerpt: page.excerpt ?? '',

          // 文章渲染后的完整 HTML，卡片里用 v-html 显示缩小版预览。
          html: page.html ?? ''
        }))
    )
  }
})