<script setup lang="ts">
// 引入默认主题（VitePress 官方自带的那套主题）。
import DefaultTheme from 'vitepress/theme'
// 引入我们要插入首页的横向文章列表组件。
import PostCarousel from './components/PostCarousel.vue'
// 引入把 hero 按钮挪到横向列表下方的按钮组件。
import HeroActions from './components/HeroActions.vue'

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
    <template #home-features-after>
      <PostCarousel />
      <HeroActions />
    </template>
  </Layout>
</template>

<!--
  全局样式（不加 scoped，才能作用到默认主题的组件上）：
  默认 hero 里的 action 按钮区已经通过 HeroActions 挪到下方横向列表之后，
  这里把默认的那份隐藏掉，避免页面上出现两套按钮。
-->
<style>
/* .VPHero .actions —— 默认主题 hero 区块里装按钮的那个容器。
   display: none → 直接不显示。因为按钮已经由 HeroActions 组件
   挪到下方横向列表之后了，这一份留着就会和它重复。
   注意这个选择器没有 scoped，能命中默认主题组件内部的元素。 */
.VPHero .actions {
  display: none;
}

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