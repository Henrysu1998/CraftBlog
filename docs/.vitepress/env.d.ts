// env.d.ts —— 类型声明文件，不参与运行逻辑，只负责「告诉编辑器」某些模块长什么样。

// 下面这行引用让编辑器认识 Vite / VitePress 提供的全局类型：
//   import.meta.env（环境变量）
//   导入 .css / .png 等静态资源时不报「找不到模块」
/// <reference types="vitepress/client" />

// 核心：声明「所有以 .vue 结尾的模块」长什么样。
// 有了它，.ts 文件里 `import Layout from './Layout.vue'` 就不会再报「找不到模块」了。
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}