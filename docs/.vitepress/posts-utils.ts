// posts-utils.ts —— 文章工具函数，供 posts.data.ts 和 config.mts 共用。
// 把「从 markdown 源码里提取标题」的逻辑集中在一个地方，
// 这样首页书架和侧边栏用的标题规则永远一致。

// 提取第一个一级标题（# xxx）。frontmatter 里没写 title 时用它兜底。
// 正则 /^#\s+(.+)$/m：
//   ^    行首
//   #    一级标题标记
//   \s+  一个或多个空白
//   (.+) 捕获标题文字
//   $    行尾
//   m    多行模式（让 ^ 和 $ 匹配每一行，而不是整个字符串）
export function extractFirstHeading(src?: string): string {
  if (!src) return '未命名'
  const match = src.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : '未命名'
}

// 提取文章标题：优先用 frontmatter 里的 title:，否则用第一个 # 标题。
// config.mts 是直接读文件源码来提取的，所以用这个函数；
// posts.data.ts 那边 VitePress 已经帮我们把 frontmatter 解析好了，
// 它只用到上面的兜底函数 extractFirstHeading。
export function extractTitle(src: string): string {
  // 文件开头的 --- 和 --- 之间是 frontmatter 配置块
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (fm) {
    // 在 frontmatter 里找 title: xxx 这一行（允许标题带单双引号）
    const title = fm[1].match(/^title:\s*['"]?([^'"]+)['"]?$/m)
    if (title) return title[1].trim()
  }
  return extractFirstHeading(src)
}
