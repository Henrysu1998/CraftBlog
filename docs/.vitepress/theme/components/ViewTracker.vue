<!--
  ViewTracker.vue —— 浏览量埋点组件（不渲染任何内容）
  放在 Layout 外壳里，监听路由变化：每当进入一篇「文章页」，
  就给这篇文章的浏览量 +1（记到 Supabase 的 article_views 表里）。
  首页（/）、分类页（/categories/...）不是文章，不计数。
-->

<script setup lang="ts">
// watch：监听数据变化，变化时执行回调
// onMounted：组件挂载到页面后执行一次
import { onMounted, watch } from 'vue'
// useRoute：拿到当前路由；useData：拿到站点配置（里面有 base 前缀）
import { useRoute, useData } from 'vitepress'
// Supabase 工具函数：给一篇指定的文章浏览量 +1
import { incrementView } from '../supabase'
// 文章数据：用来判断「当前页面是不是文章、是哪篇文章」
// @ts-expect-error VitePress 构建时注入 data 导出，编辑器静态检查看不到
import { data as posts } from '../posts.data'

// useData().site.base：站点部署路径前缀，本项目是 /CraftBlog/。
// 浏览器里 route.path 是「带这个前缀」的（实测 /CraftBlog/xxx.html），
// 而 posts.data 里的 url 是「不带前缀」的（/xxx.html），
// 所以匹配前必须先把前缀剥掉，否则永远匹配不上。
const base = (useData().site.value.base as string) ?? '/'

// normalize：统一路径格式，方便和文章 url 比较。
//   1. 站点装在子路径下时，剥掉 base 前缀（装在根目录 base 为 / 时不用剥）
//   2. 剥完后可能丢了前导斜杠（/CraftBlog/xxx → xxx），补回一个 /
//   3. 再去掉结尾多余的 /（防止 /xxx.html 和 /xxx.html/ 这种细微差别匹配不上）
function normalize(path: string): string {
  let p = path
  if (base !== '/' && p.startsWith(base)) p = p.slice(base.length)
  if (!p.startsWith('/')) p = '/' + p
  return p.replace(/\/+$/, '')
}

// 把文章数据转成「文章路径集合」（Set），方便快速判断当前页面是不是文章。
// 路径形如 /api-examples.html，和剥掉 base 后的 route.path 一致可比。
const postUrls = new Set(
  (posts as { url: string }[]).map((post) => normalize(post.url))
)

const route = useRoute()

// countCurrentPage：给「当前页面」计数。只对文章页生效。
function countCurrentPage() {
  const path = normalize(route.path)
  if (postUrls.has(path)) {
    incrementView(path)
  }
}

// 页面刚加载时计一次（整页刷新 / 直接输入网址进来时）
onMounted(countCurrentPage)

// 之后每次路由变化（SPA 里点链接换页）时再计一次。
// 注意：watch 只在路径真的变化时才触发，同一个页面内不会重复计。
watch(() => route.path, countCurrentPage)
</script>

<template>
  <!-- 不渲染任何内容：这个组件只负责埋点，不占页面空间 -->
</template>
