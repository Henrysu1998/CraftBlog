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

/* ===== 覆盖默认主题：文章/分类页底部的「上一页/下一页」翻页条 =====
   默认主题（VPDocFooter 组件）会把这两个链接做成「两张各占半行宽、
   带 1px 方框的卡片」，还会在它们上方画一条贯穿整页的横向分隔线。
   这里完全去掉方框和横线，只保留文字：
     - 上一张贴最左、下一张贴最右（flex 两端对齐）；
     - 窄屏放不下时自动换行上下堆叠。
   注意：必须用「祖先 + 标签 + 类」这样更高优先级的选择器，
   才能盖过 node_modules 里默认主题自带的 scoped 样式。 */

/* 1) 容器：改成 flex，上一张贴左、下一张贴右；去掉贯穿整页的横向线 */
.VPDocFooter nav.prev-next {
  display: flex;                 /* 弹性布局：两个文字组横着排 */
  justify-content: space-between;/* 上一页文字组贴左、下一页文字组贴右 */
  flex-wrap: wrap;               /* 放不下时自动换行（窄屏变上下堆叠） */
  column-gap: 16px;              /* 两组文字之间的最小间距 */
  border-top: 0;                 /* 取消默认的 1px 贯穿横线 */
  padding-top: 6px;              /* 补一点间距，别和上文贴太紧 */
}

/* 2) 每组文字的外层：宽度由内容决定 */
.VPDocFooter .pager {
  width: auto;
}

/* 3) 文字本体：彻底去掉方框，并把「上一页/下一页」小标签和分类名
      放到同一行横排（flex），两者基线对齐、中间留小间距 */
.VPDocFooter a.pager-link {
  display: flex;                 /* 弹性布局：小标签和分类名横着排 */
  align-items: baseline;         /* 两行文字按基线对齐（不会上下错位） */
  column-gap: 8px;               /* 小标签（胶囊）和分类名之间的间距 */
  width: auto;                   /* 不拉满整行 */
  height: auto;                  /* 高度由内容决定 */
  padding: 0;                    /* 不要内边距（没有框了） */
  border: 0;                     /* 不要边框 */
  background: transparent;       /* 不要背景 */
  border-radius: 0;              /* 不需要圆角 */
}

/* 4) 给「上一页/下一页」这个小标签加一层「淡底胶囊」：
      浅灰圆角底 + 无描边，文字仍小、颜色偏灰，不抢分类名的视觉。
      分类名本身不加底、保持普通文字。 */
.VPDocFooter a.pager-link .desc {
  display: inline-flex;          /* 胶囊正好裹住文字，不占整行 */
  align-items: center;           /* 文字在胶囊里垂直居中 */
  padding: 1px 10px;             /* 左右 10px：让胶囊边缘离字远一点，圆角才明显 */
  border-radius: 999px;          /* 超大圆角：左右两端变半圆 → 胶囊形 */
  background: var(--vp-c-bg-soft); /* 浅灰底（主题变量，深浅色模式自动适配） */
  color: var(--vp-c-text-2);     /* 字的颜色用次要文字色（浅灰） */
  font-size: 14px;               /* 字号 = 分类名字号（.title 默认 14px），两边一样大 */
  line-height: 20px;             /* 行高 20px：和分类名同一行高，胶囊高度也随之匹配 */
  white-space: nowrap;           /* 不让「上一页」三个字断行 */
}

/* 5) 鼠标悬停整条翻页链接时，胶囊微亮成主题色，作为可点击的反馈
      （去掉方框后没有任何反馈，补一个轻的） */
.VPDocFooter a.pager-link:hover .desc {
  background: var(--vp-c-brand-soft); /* 主题淡色底 */
  color: var(--vp-c-brand);           /* 字变主题色 */
}
</style>