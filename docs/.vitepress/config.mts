import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // 站点部署的基础路径。
  // 部署在 GitHub Pages 上且仓库名为 CraftBlog，所以必须设成 /CraftBlog/，
  // 否则打包后引用 css/js 等资源的绝对路径 /assets/... 会找不到文件。
  // 本地开发时若设为 / 会更方便，部署前再改回来。
  base: '/CraftBlog/',

  // 站点标题：显示在浏览器标签页、导航栏 logo 处，也用于 SEO
  title: "橘子不爱吃番茄酱的碗",

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

    // 侧边栏。数组每一项是一个「分组」，可显示分组标题并折叠。
    sidebar: [
      {
        text: 'Examples',          // 分组标题（显示在侧边栏顶部）
        items: [                   // 该分组下的导航链接列表
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    // 右上角社交图标。icon 为内置图标名（github / twitter / discord 等），
    // link 为跳转地址
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})