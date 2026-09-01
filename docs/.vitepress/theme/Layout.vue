<script setup lang="ts">
// 引入默认主题（VitePress 官方自带的那套主题）。
import DefaultTheme from 'vitepress/theme'
// 引入我们要插入首页的横向文章列表组件。
import PostCarousel from './components/PostCarousel.vue'
// 引入首页底部的分类按钮组件（书架下方那一排可点击的分类按钮）。
import CategoryTags from './components/CategoryTags.vue'
// 引入浏览量埋点组件（不渲染内容，只负责给文章页计数）。
import ViewTracker from './components/ViewTracker.vue'

// 从默认主题里解构出 Layout（默认主题的页面骨架组件）。
// 之后我们「包一层」它：保留它原有的导航栏、侧边栏、页脚等，
// 只在它预留的「插槽」里塞进自己的内容。
const { Layout } = DefaultTheme
</script>

<template>
  <!--
    用默认主题的 <Layout> 作为外壳，往里填充具名插槽（slot）。
    具名插槽：默认主题在页面的不同位置预留了「空洞」，
    我们只要用 <template #插槽名> 就能往对应的空洞里放内容。

    #home-features-after 这个插槽在「首页的 features 区块之后」，
    所以我们的文章列表和按钮都会出现在首页 features 卡片的下方。
  -->
  <Layout>
    <!-- layout-top 是默认 Layout 最外层的插槽，任何页面（首页/文章页/分类页）都会渲染。
         ViewTracker 不显示内容，放在这里负责给文章页埋点计浏览数。 -->
    <template #layout-top>
      <ViewTracker />
    </template>

    <template #home-features-before>
      <PostCarousel />
      <!-- 分类按钮：显示在书架下方，点击进入对应分类页 -->
      <CategoryTags />
    </template>
  </Layout>
</template>

<!--
  全局样式（不加 scoped，才能作用到默认主题的组件上）：
  hero.actions 配置已经从 index.md 里删除，首页不再显示那两颗按钮，
  所以这里也不再需要隐藏默认 hero 的按钮区。
-->
<style>
/* 列表圆点颜色（模仿 Typora：缩进后的圆点变浅）。
   ::marker 是「项目符号（圆点/数字）」本身，直接对它设颜色。
   .vp-doc 是 VitePress 渲染 markdown 正文的容器类名。
   第一级圆点用正常文字色 var(--vp-c-text-1)； */
.vp-doc ul > li::marker,
.vp-doc ol > li::marker {
  color: var(--vp-c-text-1);   /* 主文字色（正常黑/白） */
}

/* 嵌套（缩进）层级再深的列表，圆点用更浅的颜色 var(--vp-c-text-3)，
   和 Typora 一样能看出层级。选择器写法：
   li > ul > li —— 一个 li 里再套一个 ul/ol，里面再套的 li 就是「二级圆点」 */
.vp-doc li > ul > li::marker,
.vp-doc li > ol > li::marker {
  color: var(--vp-c-text-3);   /* 次要文字色（比主文字色浅） */
}
</style>