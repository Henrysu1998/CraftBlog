---
# 分类页模板：VitePress 会把它复制成每个分类的独立页面。
# :category 是 URL 里的「占位符」，对应同目录 [category].paths.ts 返回的分类名（如 教程）。
# 页面标题（浏览器标签页和正文顶部的标题）由 [category].paths.ts 里的
# transformPageData 自动设成当前分类名，这里不用管。
# 正文交给下面的 CategoryPage 组件去渲染「该分类下的文章列表」。
---

<script setup>
// 在 markdown 里使用 Vue 组件前，要先 import 进来（VitePress 不会自动注册组件）。
// CategoryPage 组件负责渲染当前分类下的文章列表。
import CategoryPage from '../.vitepress/theme/components/CategoryPage.vue'
</script>

<CategoryPage />
