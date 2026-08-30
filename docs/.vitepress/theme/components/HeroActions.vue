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
.hero-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  max-width: 1152px;
  margin: 0 auto 48px;
  padding: 0 24px;
}

/* 按钮外观复刻 VitePress 默认 hero 按钮（和顶部那份长得一样） */
.action-btn {
  display: inline-block;
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 0 20px;
  line-height: 38px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
  transition: color 0.25s, border-color 0.25s, background-color 0.25s;
}

/* theme: brand —— 实心主题色按钮 */
.action-btn.brand {
  border-color: var(--vp-button-brand-border);
  color: var(--vp-button-brand-text);
  background-color: var(--vp-button-brand-bg);
}
.action-btn.brand:hover {
  border-color: var(--vp-button-brand-hover-border);
  color: var(--vp-button-brand-hover-text);
  background-color: var(--vp-button-brand-hover-bg);
}

/* theme: alt（或没写 theme）—— 描边/次要按钮 */
.action-btn.alt {
  border-color: var(--vp-button-alt-border);
  color: var(--vp-button-alt-text);
  background-color: var(--vp-button-alt-bg);
}
.action-btn.alt:hover {
  border-color: var(--vp-button-alt-hover-border);
  color: var(--vp-button-alt-hover-text);
  background-color: var(--vp-button-alt-hover-bg);
}
</style>
