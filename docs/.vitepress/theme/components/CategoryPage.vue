<!--
  CategoryPage.vue —— 分类页的文章列表
  每个分类页（/categories/分类名）都会渲染这个组件：
    1. 从路由参数里拿到当前分类名
    2. 从 categories.data 里找到这个分类下的所有文章
    3. 把文章标题 + 日期列出来，点标题进入文章
-->

<script setup lang="ts">
// computed：创建「由其它数据算出来」的数据，依赖一变它自动跟着变
import { computed } from 'vue'
// useData：读取当前页面的路由参数；withBase：给链接补上站点的 base 前缀
import { useData, withBase } from 'vitepress'

// 导入分类数据加载器（categories.data.ts），拿到按分类分好组的文章。
// `data` 是 VitePress 对 .data.ts 文件约定注入的导出，构建时会把结果填进去。
// 编辑器 TypeScript 看不到这个 data 导出，会报「没有导出 data」，属于误报，
// 用 @ts-expect-error 消除（和 PostCarousel.vue 里的写法一致）。
// @ts-expect-error VitePress 构建时注入 data 导出，编辑器静态检查看不到
import { data as categories } from '../categories.data'

// 一个分类的数据结构，和 categories.data.ts 的 transform 返回结果保持一致：
//   name  —— 分类名（比如「教程」）
//   posts —— 该分类下的文章列表（标题 / 链接 / 日期）
interface CategoryItem {
  name: string
  posts: { title: string; url: string; date: string | null }[]
}

// 因为 @ts-expect-error 让 data 的静态类型变成了 any（编辑器不知道它长什么样），
// 下面直接 .find((c) => ...) 时 c 会被推断成隐式 any，触发 TS7006 报错。
// 所以先用 unknown 中转强转成我们定义好的 CategoryItem[]，让 c 有明确类型。
// （写法上和 PostCarousel.vue 里把 posts 转成 Post[] 保持一致。）
const categoryList = categories as unknown as CategoryItem[]

// useData() 返回当前页面的信息，其中 params 是动态路由的参数。
// 在分类页里 params.category 就是当前分类名（比如「教程」）。
const { params } = useData()

// 当前分类名：params 是响应式的，用 computed 取出来，
// 这样从一个分类页切到另一个分类页时，这里会自动跟着更新。
// 用 ?. 做保护：个别情况下（比如页面切换的瞬间）params.value 可能是 undefined，
// 直接写 params.value.category 会抛「Cannot read properties of undefined」。
// 取不到就给空字符串，下面自然落到「该分类下暂无文章」的分支，而不是报错。
const categoryName = computed(() => params.value?.category ?? '')

// 从所有分类里找出当前分类；找不到（理论上不会）就返回 undefined，页面显示「暂无文章」。
const current = computed(() => categoryList.find((c) => c.name === categoryName.value))

// 当前分类下的文章列表；分类不存在时兜底成空数组。
const posts = computed(() => current.value?.posts ?? [])
</script>

<template>
  <!-- 分类名标题：由组件自己渲染（markdown 里的标题没法带动态参数渲染），
       和浏览器标签页的标题（transformPageData 设的 pageData.title）保持一致 -->
  <h1 class="category-heading">{{ categoryName }}</h1>

  <!-- 有文章才渲染列表 -->
  <ul v-if="posts.length" class="category-post-list">
    <li v-for="post in posts" :key="post.url" class="category-post-item">
      <!-- 点标题跳转到文章详情页。
           withBase() 给 url 补上 /CraftBlog/ 前缀，否则会 404。 -->
      <a :href="withBase(post.url)" class="category-post-title">{{ post.title }}</a>
      <!-- v-if="post.date"：日期有值才显示 -->
      <time v-if="post.date" class="category-post-date">{{ post.date }}</time>
    </li>
  </ul>

  <!-- 该分类下没有文章时的提示 -->
  <p v-else class="category-post-empty">该分类下暂无文章</p>
</template>

<style scoped>
/* scoped：样式只对本组件的元素生效，不会影响其它组件或页面 */

/* 分类名标题：大一点的字号，和文章列表隔开 */
.category-heading {
  margin: 0 0 16px;          /* 外边距：上 0 / 左右 0 / 下 16px（和文章列表隔开） */
  font-size: 28px;           /* 标题字号（比文章标题大） */
  font-weight: 700;          /* 粗体 */
  color: var(--vp-c-text-1); /* 主文字色 */
}

/* 列表容器：去掉默认的圆点和留白 */
.category-post-list {
  list-style: none;            /* 去掉列表默认的项目符号（圆点） */
  margin: 0;                   /* 去掉默认外边距 */
  padding: 0;                  /* 去掉默认内边距 */
}

/* 每个条目：标题和日期竖着排列，条目之间用分隔线区分 */
.category-post-item {
  padding: 12px 0;             /* 上下各留 12px，让条目之间透气 */
  border-bottom: 1px solid var(--vp-c-divider); /* 底部 1px 分隔线（主题分隔线色） */
}

/* 文章标题链接：主文字色、无下划线，悬停变主题色 */
.category-post-title {
  display: block;              /* 独占一行，日期才能排到它下面 */
  font-size: 16px;             /* 标题字号 */
  font-weight: 600;            /* 字重 600（半粗体） */
  color: var(--vp-c-text-1);   /* 主文字色（正常黑/白） */
  text-decoration: none;       /* 去掉链接默认的下划线 */
  transition: color 0.2s;      /* 悬停变色时 0.2 秒平滑过渡 */
}
.category-post-title:hover {
  color: var(--vp-c-brand);    /* 鼠标悬停时变成主题强调色 */
}

/* 日期：小号、次要颜色，放在标题下方 */
.category-post-date {
  display: block;              /* 独占一行 */
  margin-top: 4px;             /* 和标题隔开 4px */
  font-size: 13px;             /* 小号字 */
  color: var(--vp-c-text-2);   /* 次要文字色（比正文浅一点） */
}

/* 空分类的提示文字 */
.category-post-empty {
  color: var(--vp-c-text-2);   /* 次要文字色（弱提示） */
}
</style>
