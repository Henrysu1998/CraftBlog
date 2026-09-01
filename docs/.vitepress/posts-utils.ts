// posts-utils.ts —— 文章工具函数，供 posts.data.ts、categories.data.ts 和 config.mts 共用。
// 把「从 markdown 源码里提取标题 / 分类」的逻辑集中在一个地方，
// 这样首页书架、分类页和侧边栏用的规则永远一致。

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

  // 先把开头的 frontmatter 配置块（--- 到 ---）去掉。
  // 为什么要去：frontmatter 里允许写 # 开头的注释行（比如分类说明），
  // 不去掉的话，这个 # 注释会被当成正文标题，文章标题就显示成注释文字了。
  // 正则 /^---\r?\n[\s\S]*?\r?\n---\r?\n?/：
  //   ^---\r?\n   文件开头是 --- 和换行
  //   [\s\S]*?    中间任意内容（非贪婪，尽量短）
  //   \r?\n---    以 --- 结尾
  //   \r?\n?      结尾的换行（有则吞掉，避免标题前多空一行）
  const body = src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')

  const match = body.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : '未命名'
}

// 提取文章的分类列表：从 frontmatter 里读 categories 字段。
// 支持两种写法（写在文章开头的 --- 配置块里）：
//   categories: 教程            —— 单个分类（一个字符串）
//   categories: [教程, 部署]     —— 多个分类（方括号数组）
// 返回分类名的数组；没写 categories 就返回空数组 []。
// config.mts 和动态路由的 [category].paths.ts 都靠它来知道「站点里有哪些分类」。
export function extractCategories(src: string): string[] {
  // 先取出 frontmatter 配置块（文件开头 --- 和 --- 之间的部分）
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) return []

  // 在 frontmatter 里找 categories: 这一行，把冒号后面的内容捕获出来
  // 正则 /^categories:\s*(.+)$/m：
  //   ^categories:   行首必须是 categories:
  //   \s*            冒号后面的空白（可有可无）
  //   (.+)           捕获这一行剩下的所有内容（就是分类名部分）
  //   $              行尾
  //   m              多行模式：让 ^ 和 $ 匹配每一行，而不是整个字符串
  const line = fm[1].match(/^categories:\s*(.+)$/m)
  if (!line) return []

  // value 是这一行里冒号后面的原始内容（还没去掉空格和引号）
  const value = line[1].trim()

  // 情况一：方括号数组写法 —— categories: [教程, 部署]
  if (value.startsWith('[')) {
    return (
      value
        // 去掉最外层的 [ 和 ]，剩下 "教程, 部署"
        .replace(/^\[|\]$/g, '')
        // 按逗号拆成一个个分类名
        .split(',')
        // 每个名字去掉首尾空格
        .map((item) => item.trim())
        // 再去掉可能包裹名字的单双引号（比如 [教程, "部署"]）
        .map((item) => item.replace(/^['"]|['"]$/g, ''))
        // 过滤掉空字符串（比如误写成了 [教程, ] 多留了个空）
        .filter((item) => item.length > 0)
    )
  }

  // 情况二：单个分类写法 —— categories: 教程
  // 去掉可能存在的引号，去掉后若是空字符串就当作「没写分类」返回空数组
  const name = value.replace(/^['"]|['"]$/g, '')
  return name ? [name] : []
}
