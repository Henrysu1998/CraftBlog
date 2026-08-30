// posts.data.ts —— 「数据加载器」，负责在构建时收集所有文章的信息。

// createContentLoader 是 VitePress 提供的方法：给它一个文件匹配规则（glob），
// 它会在构建时读取这些文件，把每篇文章的信息整理成数组。
import { createContentLoader } from 'vitepress'
// node:path 的 posix 部分：拼路径时统一用斜杠 /（跨 Windows/Mac/Linux 一致）
import path from 'node:path'
// 共用的标题提取函数：和 config.mts 用同一份，保证标题规则一致
import { extractFirstHeading } from '../posts-utils.js'

// 取站点的 base（部署路径前缀，本项目是 /CraftBlog/）。
// VitePress 构建时会把整份配置挂到全局对象上，
// transform 是在构建时才执行的，所以这时一定能取到值。
function getBase(): string {
  // 类型断言：VITEPRESS_CONFIG 是 VitePress 内部注入的，TypeScript 不认识，用 any 跳过检查
  const config = (globalThis as any).VITEPRESS_CONFIG
  // 取不到就给 '/'（站点装在域名根目录时，base 本来就是 '/'）
  return config?.site?.base ?? '/'
}

// 把文章 HTML 里图片的相对路径，改成「带 base 前缀的绝对路径」。
// 为什么要改：
//   文章里写的图片路径是相对路径，比如 ./images/x.png，这个路径是
//   「相对于文章自己所在的位置」的，文章页能正常显示。
//   但首页卡片是用 v-html 直接把这段 HTML 塞进首页的，到了首页，
//   浏览器会拿首页的地址去解析 ./images/x.png，结果找不到文件，图片就破了。
//   所以这里把相对路径统一重写成像 /CraftBlog/images/x.png 这样的绝对路径，
//   无论在首页还是文章页都能找到图片。
// 参数：
//   html —— 文章渲染后的 HTML
//   url  —— 文章的链接地址（如 /vitepress-githubPage.html），用来推导文章所在目录
//   base —— 站点部署路径前缀（如 /CraftBlog/）
function fixImagePaths(html: string, url: string, base: string): string {
  // 推导文章所在目录：把 url 里最后一个「/xxx.html」去掉。
  // 比如 /vitepress-githubPage.html → 空字符串（文章在站点根目录）
  //      /子目录/文章.html           → /子目录
  const dir = url.replace(/\/[^/]+\.html?$/, '')

  // 用正则找到所有 src="..."，只改以 ./ 或 ../ 开头的相对路径，其它原样保留。
  return html.replace(/src="([^"]+)"/g, (match, src: string) => {
    // 不是相对路径（比如 http://、/assets/、data: 等）就跳过
    if (!src.startsWith('./') && !src.startsWith('../')) return match

    // path.posix.join 负责处理 ./ 和 ../：把相对路径按文章目录解析成站点根下的绝对路径。
    // 例如 文章在根目录、src=./images/x.png → /images/x.png
    // 例如 文章在 /sub、    src=../img/y.png → /img/y.png
    const abs = path.posix.join('/', dir, src)

    // 再和 base 拼起来得到最终路径。join 会自动整理重复的斜杠，
    // 避免拼出 /CraftBlog//images/ 这种难看（虽然浏览器能识别）的双斜杠。
    return `src="${path.posix.join(base, abs)}"`
  })
}

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
          // 摘要也是一段渲染后的 HTML，同样做图片路径修复，保持一致性。
          excerpt: fixImagePaths(page.excerpt ?? '', page.url, getBase()),

          // 文章渲染后的完整 HTML，卡片里用 v-html 显示缩小版预览。
          // fixImagePaths() 把里面图片的相对路径改成带 base 的绝对路径，
          // 否则图片在首页上会因为路径对不上而显示不出来（这是本次修复的重点）。
          html: fixImagePaths(page.html ?? '', page.url, getBase())
        }))
    )
  }
})