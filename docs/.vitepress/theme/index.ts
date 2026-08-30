// 自定义主题的入口文件。
// VitePress 会优先找 docs/.vitepress/theme/index.ts，用它作为站点主题。

// 引入默认主题（官方那套完整主题）。
import DefaultTheme from 'vitepress/theme'
// 引入我们自定义的 Layout（在默认 Layout 基础上塞了首页文章列表）。
import Layout from './Layout.vue'

// 导出一个「主题对象」，这是 VitePress 规定的格式。
export default {
  // extends: DefaultTheme —— 「继承默认主题」。
  // 意思是：保留默认主题的所有东西（导航栏、样式、组件等），
  // 只覆盖下面我们列出的部分。这里只覆盖了 Layout。
  extends: DefaultTheme,

  // 用我们自己的 Layout 替换默认的 Layout。
  // 我们的 Layout 内部又包了一层默认 Layout，所以等于是「在默认基础上加东西」。
  Layout
}