<!--
  CategoryTags.vue —— 首页底部的分类按钮
  渲染在文章书架的下方：一排可点击的分类按钮。
  每个按钮显示「分类名 + 文章数」，样式复刻 VitePress 默认 hero 按钮的
  「空心（alt）主题」格式并放大一档（big 尺寸），
  点击跳到对应分类页（/categories/分类名）。
-->

<script setup lang="ts">
// withBase：VitePress 提供的工具函数，给链接补上站点的 base 前缀（/CraftBlog/）
import { withBase } from 'vitepress'

// 导入分类数据加载器（categories.data.ts），拿到所有分类以及每类的文章。
// @ts-expect-error VitePress 构建时注入 data 导出，编辑器静态检查看不到
import { data as categories } from '../categories.data'
</script>

<template>
  <!-- 有分类才渲染这一排按钮 -->
  <nav v-if="categories.length" class="category-tags">
    <!-- 每个分类一个按钮：分类名 + 文章数小圆标，点击进对应分类页 -->
    <a
      v-for="cat in categories"
      :key="cat.name"
      class="category-tag"
      :href="withBase('/categories/' + cat.name)"
    >
      <span class="category-tag-name">{{ cat.name }}</span>
      <span class="category-tag-count">{{ cat.posts.length }}</span>
    </a>
  </nav>
</template>

<style scoped>
/* scoped：样式只对本组件的元素生效，不会影响其它组件或页面 */

/* 按钮容器：一排、水平居中，按钮太多放不下时自动换行 */
.category-tags {
  display: flex;              /* flex：子元素（按钮）横向排成一行 */
  flex-wrap: wrap;            /* 一行放不下时自动换到下一行 */
  justify-content: center;    /* 整排水平居中 */
  gap: 12px;                  /* 相邻两个按钮之间的距离（和原 hero 按钮一致） */
  max-width: 1152px;          /* 最大宽度：和上方书架一致，屏幕再宽也不超 */
  margin: 0 auto 48px;        /* 外边距：上 0 / 左右 auto（水平居中）/ 下 48px（和页脚隔开） */
  padding: 0 24px;            /* 内边距：上下 0 / 左右 24px（窄屏时按钮不贴屏幕边） */
}

/* 单个分类按钮：复刻 VitePress 默认 hero 按钮的「空心（alt）主题」格式，
   并采用默认按钮里更大的 big 尺寸（比普通按钮高一截）。
   每个属性含义：
   display: inline-flex      → 内联弹性盒：名称和数字横向排开，同时能设内外边距
   align-items: center       → 名称和数字垂直居中对齐
   border: 1px solid transparent → 默认先画一圈「透明」的 1px 边框，
        这样 hover 换边框颜色时按钮不会因为多出边框而抖动（位置不变）
   border-radius: 24px       → 圆角 24px：按钮两端变圆（big 尺寸的圆角）
   line-height: 46px         → 行高 46px：配合「上下 padding 为 0」，按钮高 46px
   var(--vp-button-alt-xxx) 是一组主题变量：VitePress 主题提供的「次要按钮」配色，
        背景接近页面底色、文字用普通文字色，边框用主题描边色，
        呈现「空心」效果，浅色/深色模式下自动换成对应的值。 */
.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;                   /* 名称和数字之间的距离 */
  border: 1px solid transparent;
  border-radius: 24px;
  padding: 0 24px;            /* 内边距：左右 24px（文字离按钮边缘），上下 0 */
  line-height: 46px;          /* 行高 46px：配合「上下 padding 为 0」，按钮高 46px */
  font-size: 16px;            /* 按钮文字字号（big 尺寸比默认大一档） */
  font-weight: 600;           /* 字重 600（半粗体），和 hero 按钮一致 */
  white-space: nowrap;        /* 文字不换行：分类名再长也一行显示 */
  text-decoration: none;      /* 去掉链接默认的下划线 */
  border-color: var(--vp-button-alt-border);   /* 边框：主题描边色（空心靠它勾边） */
  color: var(--vp-button-alt-text);            /* 文字：次要按钮文字色 */
  background-color: var(--vp-button-alt-bg);   /* 背景：接近页面底色（空心效果） */
  transition: color 0.25s, border-color 0.25s, background-color 0.25s;
  /* 悬停变色的过渡动画：文字色 / 边框色 / 背景色变化时 0.25 秒平滑过渡 */
}
/* :hover —— 鼠标悬停时的样子（比平时深一号，有「按下去/指向」感） */
.category-tag:hover {
  border-color: var(--vp-button-alt-hover-border);  /* 悬停：边框变深一号 */
  color: var(--vp-button-alt-hover-text);           /* 悬停：文字变深一号 */
  background-color: var(--vp-button-alt-hover-bg);  /* 悬停：背景变深一号 */
}

/* 分类名（字重跟随按钮，保持整体一致） */
.category-tag-name {
  font-weight: 600;
}

/* 文章数的小圆标：浅色胶囊，突出数量（在空心按钮上用浅色底，不抢眼）。
   color 用主题强调色，background 用主题的浅色底 var(--vp-c-bg-soft)，
   深浅色模式下都协调。 */
.category-tag-count {
  padding: 0 8px;             /* 内边距：数字四周留白 */
  border-radius: 999px;       /* 胶囊圆角 */
  font-size: 12px;            /* 数字小一号 */
  font-weight: 500;           /* 比按钮文字细一点 */
  line-height: 18px;          /* 固定行高，控制小圆标的高度 */
  color: var(--vp-c-brand);   /* 数字用主题强调色 */
  background: var(--vp-c-bg-soft); /* 浅色底（主题变量，深浅色自动适配） */
}
</style>
