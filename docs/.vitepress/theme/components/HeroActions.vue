<!--
  HeroActions.vue —— 从页面 frontmatter 的 hero.actions 里读取按钮配置并渲染。
  作用：把原本显示在 hero 顶部的按钮，挪到首页横向文章列表的下方。
  配置仍然写在 index.md 的 hero.actions 里，这里只是「换一个地方渲染」。
-->

<script setup lang="ts">
// computed：由其它数据算出来的响应式值
import { computed } from 'vue'
// useData：读取当前页面 frontmatter；withBase：给链接补 base 前缀
import { useData, withBase } from 'vitepress'

// useData() 返回当前页面的 frontmatter（响应式，页面切换会自动更新）
const { frontmatter } = useData()

// 从 frontmatter 的 hero.actions 读按钮配置（和默认 hero 用的是同一份数据）。
// hero 可能没写，用可选链 ?. 和空值合并 ?? 兜底成空数组。
const actions = computed(() => frontmatter.value.hero?.actions ?? [])
</script>

<template>
  <!-- 有按钮才渲染。一排、居中，放在横向列表下方 -->
  <div v-if="actions.length" class="hero-actions">
    <a
      v-for="action in actions"
      :key="action.link"
      class="action-btn"
      :class="action.theme === 'brand' ? 'brand' : 'alt'"
      :href="withBase(action.link)"
    >
      {{ action.text }}
    </a>
  </div>
</template>

<style scoped>
/* 按钮排成一排的容器：
   display: flex → 开启弹性布局，子元素（按钮）自动从一行排开 */
.hero-actions {
  display: flex;              /* flex：子元素横向排成一行 */
  justify-content: center;    /* 一行里的按钮整体水平居中（flex 的对齐方式） */
  gap: 12px;                  /* 相邻两个按钮之间的距离（左右各留 12px） */
  max-width: 1152px;          /* 最大宽度：屏幕再宽也不超过 1152px */
  margin: 0 auto 48px;        /* 外边距：上 0 / 左右 auto（水平居中）/ 下 48px（和下方内容隔开） */
  padding: 0 24px;            /* 内边距：上下 0 / 左右 24px（窄屏时按钮不贴屏幕边） */
}

/* 按钮外观复刻 VitePress 默认 hero 按钮（和顶部那份长得一样）。
   每个属性含义：
   display: inline-block     → 内联块：能像行内元素排在一排，又能设宽高边距
   border: 1px solid transparent → 默认先画一圈「透明」的 1px 边框，
        这样 hover 换边框颜色时按钮不会因为多出边框而抖动（位置不变）
   border-radius: 20px       → 圆角 20px：按钮两端变圆（胶囊/圆角矩形） */
.action-btn {
  display: inline-block;
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 0 20px;            /* 内边距：左右 20px（文字离按钮边缘），上下 0 */
  line-height: 38px;          /* 行高 38px：配合「上下 padding 为 0」，文字垂直居中，按钮高 38px */
  font-size: 14px;            /* 按钮文字字号 */
  font-weight: 600;           /* 字重 600（半粗体） */
  white-space: nowrap;        /* 文字不换行：按钮文字再长也一行显示，不会折成两行 */
  text-decoration: none;      /* 去掉链接默认的下划线 */
  transition: color 0.25s, border-color 0.25s, background-color 0.25s;
  /* 悬停变色的过渡动画：文字色 / 边框色 / 背景色变化时 0.25 秒平滑过渡 */
}

/* theme: brand —— 实心主题色按钮（主要按钮，用主题强调色填充）。
   var(--vp-button-brand-xxx) 是一组主题变量：VitePress 主题提供的「品牌色按钮」
   的配色，浅色/深色模式下自动换成对应的值。 */
.action-btn.brand {
  border-color: var(--vp-button-brand-border);   /* 边框：品牌色边框 */
  color: var(--vp-button-brand-text);            /* 文字：品牌色文字（通常白色） */
  background-color: var(--vp-button-brand-bg);   /* 背景：品牌色填充 */
}
/* :hover —— 鼠标悬停时的样子（没写的话就一直用上面的默认样式） */
.action-btn.brand:hover {
  border-color: var(--vp-button-brand-hover-border);  /* 悬停：边框变深一号 */
  color: var(--vp-button-brand-hover-text);           /* 悬停：文字变深一号 */
  background-color: var(--vp-button-brand-hover-bg);  /* 悬停：背景变深一号（有按下去/指向感） */
}

/* theme: alt（或没写 theme）—— 描边/次要按钮（次要操作，视觉比 brand 弱）。
   同样用 var(--vp-button-alt-xxx) 主题变量自动适配深浅色模式。 */
.action-btn.alt {
  border-color: var(--vp-button-alt-border);   /* 边框：次要色边框 */
  color: var(--vp-button-alt-text);            /* 文字：次要色文字 */
  background-color: var(--vp-button-alt-bg);   /* 背景：次要色背景（通常接近页面底色） */
}
.action-btn.alt:hover {
  border-color: var(--vp-button-alt-hover-border);  /* 悬停：边框变深一号 */
  color: var(--vp-button-alt-hover-text);           /* 悬停：文字变深一号 */
  background-color: var(--vp-button-alt-hover-bg);  /* 悬停：背景变深一号 */
}
</style>
