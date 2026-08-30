<!--
  PostCarousel.vue —— 首页「书架」风格的文章卡片
  效果：
    1. 当前文章：一张完整卡片，居中展示，含标题/日期/文章缩小版预览
    2. 非当前文章：像书架上的书一样，左右各露出几张，缩小并往后退（tucked in）
    3. 环形列表：左右箭头按钮翻页，首尾相连（第一篇往左绕到最后一篇，
       最后一篇往右绕回第一篇）
    4. 点卡片标题跳转到文章详情页
  注意：这里不再做横向滚动/拖拽（旧的 setPointerCapture 会把 click 事件劫持到容器上，
  导致点卡片无法跳转文章）。
-->

<script setup lang="ts">
// <script setup> 是 Vue 3 的语法糖：逻辑直接写在这里，不用手动 return 给模板。
// 这里只用到两个 Vue 工具：
//   ref      —— 创建「响应式数据」，改变它会自动重新渲染界面
//   computed —— 创建「由其它数据算出来」的数据，依赖一变它自动跟着变
import { computed, ref } from 'vue'

// withBase 是 VitePress 提供的工具函数：给路径补上站点的 base 前缀。
// 我们的站点部署在 /CraftBlog/ 下，而数据加载器返回的 url 是不带前缀的
// （如 /api-examples.html）。直接当 href 用会跳到 /api-examples.html 导致 404，
// 所以跳转链接都要经过 withBase() 补前缀。
import { withBase } from 'vitepress'

// 导入数据加载器（posts.data.ts）里的文章数据。
// `data` 是 VitePress 对 `.data.ts` 文件约定注入的导出，构建时会把文章列表填进去。
// 注意：post.data.ts 源码里只有 `export default createContentLoader(...)`，没有 `data`，
// 所以编辑器的 TypeScript 会报「没有导出 data」。这是 VitePress 构建时才注入的，
// 属于编辑器的误报，构建/运行都正常。用 @ts-expect-error 消除这个误报。
// @ts-expect-error VitePress 构建时注入 data 导出，编辑器静态检查看不到
import { data as posts } from '../posts.data'

// interface 是 TS 的「类型定义」：描述一个文章对象长什么样。
// 让后面用 items 时，编辑器能提示有哪些字段、类型是什么。
interface Post {
  title: string        // 标题
  url: string          // 链接地址
  date: string | null  // 日期，可能没有（所以允许 null）
  excerpt: string      // 摘要（备用字段）
  html: string         // 文章渲染后的完整 HTML，用于卡片里的缩小版预览
}

// posts 是数据加载器返回的结果，TS 不知道它的具体结构，
// 这里用「类型断言」（as）告诉 TS：把它当作 Post[]（Post 数组）来用。
const items = posts as unknown as Post[]

// current：当前在中间展示的文章在 items 里的下标（第几本）。
const current = ref(0)

// sideCount：当前卡片左右两侧各露出几张「书」。想露出更多就调大这个数字。
const sideCount = 2

// total：文章总数。visibleCount：最多同时显示的卡片数。
// 环形模式下如果文章总数比 2*sideCount+1 还少，就少显示几张，
// 避免同一篇文章在书架里出现两次。
const total = items.length
const visibleCount = Math.min(2 * sideCount + 1, total)

// stack：把 current 和它左右若干个邻居一起算出来，构成「书架」。
// 用取模（% total）实现环形：跨过首尾时会自动绕到另一边，
// 所以翻到最后一篇后继续点右箭头，会回到第一篇。
// 每一项带一个 k：k=0 是中间当前的卡片；k 为负在左边，为正在右边，
// 绝对值越大离得越远、越往后退。
// 用 computed 包裹：current 变化时这里自动重新算，界面跟着更新。
const stack = computed(() => {
  const list: { post: Post; k: number }[] = []
  for (let i = 0; i < visibleCount; i++) {
    // 把下标对齐到中间：让第 0 个槽位对应最中间那张（k=0）
    const k = i - Math.floor(visibleCount / 2)
    // 取模实现环形：% total 后一定落在合法范围内；因为 visibleCount ≤ total，
    // 这些下标各不相同，不会出现重复文章。
    const idx = (current.value + k + total) % total
    list.push({ post: items[idx], k })
  }
  return list
})

// front：中间当前的卡片（k=0）。没有文章时为 null，模板里会显示「暂无文章」。
const front = computed(() => stack.value.find((item) => item.k === 0) ?? null)

// side：左右两侧的「书」（k ≠ 0），渲染成缩小、后退的小卡片。
const side = computed(() => stack.value.filter((item) => item.k !== 0))

// 往前翻一页：环形，取模绕回。到第一篇再点会跳到最后一篇。
function prev() {
  if (total) current.value = (current.value - 1 + total) % total
}

// 往后翻一页：环形，取模绕回。到最后一篇再点会跳回第一篇。
function next() {
  if (total) current.value = (current.value + 1) % total
}

// cardStyle(k)：计算中间当前卡片（k=0）的定位样式。
// 用百分比做横向偏移，能跟着卡片宽度自适应。
// 返回 transform + zIndex：居中 + 前后层次。注意这里不能带 opacity，
// 因为中间卡片要配合 <Transition> 做淡入淡出，内联 opacity 会挡住过渡动画。
function cardStyle(k: number) {
  const shift = k * 16   // 每往外一层，横向多错开卡片宽度的 16%
  const scale = Math.max(0.5, 1 - Math.abs(k) * 0.17)  // 越往外越小
  return {
    transform: `translateX(calc(-50% + ${shift}%)) scale(${scale})`,
    zIndex: 40 - Math.abs(k) * 10
  }
}

// sideStyle(k)：两侧「书」的样式。在 cardStyle 基础上，越往外越淡，
// 做出「往书架里退」的层次感。
function sideStyle(k: number) {
  return {
    ...cardStyle(k),
    opacity: 1 - Math.abs(k) * 0.15
  }
}
</script>

<template>
  <section class="post-carousel">
    <!-- 没有文章时显示的占位提示 -->
    <p v-if="!front" class="empty">暂无文章</p>

    <!-- 有文章时才显示书架卡片区 -->
    <div v-else class="book">
      <!-- 中间当前的卡片。
           结构：外层 .card-pos 负责定位（居中、前后层次），
           内层 .card 负责内容和进出场动画 —— 两层分开，互不干扰。 -->
      <Transition name="page">
        <div class="card-pos" :key="front.post.url" :style="cardStyle(0)">
          <article class="card">
            <h3 class="card-title">
              <!-- 点标题跳转到文章详情页。
                   withBase() 给 url 补上 /CraftBlog/ 前缀，否则会 404。 -->
              <a :href="withBase(front.post.url)">{{ front.post.title }}</a>
            </h3>
            <!-- v-if="front.post.date"：date 有值才显示日期 -->
            <time v-if="front.post.date" class="card-date">{{ front.post.date }}</time>
            <!-- 文章的缩小版预览：用 v-html 把渲染后的 HTML 塞进卡片，
                 配合 CSS 限高 + 底部渐隐，看起来像文章的迷你版。
                 注意 v-html 注入的内容不带本组件的 scope，样式要用 :deep() 命中。 -->
            <div class="card-content" v-html="front.post.html"></div>
          </article>
        </div>
      </Transition>

      <!-- 左右两侧的「书」：非当前文章，缩小后退。
           pointer-events: none 让它们不拦截鼠标（点它们没有反应，翻页靠箭头）。 -->
      <div
        v-for="item in side"
        :key="item.post.url"
        class="card-pos"
        :style="sideStyle(item.k)"
      >
        <article class="card peek">
          <h3 class="card-title peek-title">{{ item.post.title }}</h3>
        </article>
      </div>

      <!-- 左右箭头按钮：翻页。放在书架最外侧，和卡片不重叠。
           环形列表：两个方向都可以一直点，跨过首尾会自动绕回去。 -->
      <button class="nav prev" aria-label="上一篇" @click="prev">‹</button>
      <button class="nav next" aria-label="下一篇" @click="next">›</button>
    </div>
  </section>
</template>

<style scoped>
/* scoped 表示这里写的样式只对本组件生效，不会污染其他组件 */

.post-carousel {
  margin: 48px auto 0;   /* 48px 是顶部与 hero 的距离，改大数值让它往下挪 */
  max-width: 1240px;
  padding: 0 24px 48px;
}

/* 书架区域：相对定位，里面的卡片和箭头都以此为准 */
.book {
  position: relative;
  height: 320px;
  max-width: 1160px;
  margin: 0 auto;
}

/* 卡片定位层：负责居中（left:50% + translateX(-50%)）和前后层次。
   transform-origin: bottom center —— 缩放时底部不动，让两侧的书像立在书架上一样底对齐。 */
.card-pos {
  position: absolute;
  top: 0;
  left: 50%;
  width: min(660px, 62vw);
  height: 280px;
  transform-origin: bottom center;
  transition: transform 0.4s ease;
}

/* 卡片本体：填满定位层，内容样式在这里 */
.card {
  width: 100%;
  height: 100%;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  /* 给 transform / opacity 加过渡：翻页动画和错位移动才平滑 */
  transition: transform 0.4s ease, opacity 0.4s ease;
}

/* 翻页进出场动画（配合 <Transition name="page">）。
   外层 .card-pos 只做淡入淡出（opacity 没有被内联样式占用，能生效）；
   内层 .card 负责「翻开」的上下位移。 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.4s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
.page-enter-from .card {
  transform: translateY(24px);
}
.page-leave-to .card {
  transform: translateY(-24px);
}

.card-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
}

/* 标题本身是跳转链接：去掉默认下划线和颜色，悬停变主题色 */
.card-title a {
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.2s;
}
.card-title a:hover {
  color: var(--vp-c-brand);
}

.card-date {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

/* 文章的缩小版预览区：限高 + 超出隐藏 + 底部渐隐，暗示后面还有内容 */
.card-content {
  margin-top: 12px;
  max-height: 160px;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  /* 底部渐隐（渐透明），比硬生生截断更自然。
     -webkit-mask-image 是旧浏览器前缀，mask-image 是标准写法 */
  -webkit-mask-image: linear-gradient(to bottom, #000 60%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 60%, transparent 100%);
}

/* v-html 注入的内容不带本组件的 scope 属性，普通 scoped 选择器命中不了，
   必须用 :deep() 才能给里面的 h1/p/pre 等元素套样式。
   这里把字号都改小，让卡片看起来像「文章的缩小版」。 */
.card-content :deep(h1),
.card-content :deep(h2),
.card-content :deep(h3),
.card-content :deep(h4) {
  margin: 10px 0 4px;
  font-size: 15px;
  line-height: 1.4;
}
/* 文章页的第一个一级标题通常和卡片标题重复，这里隐藏它，避免出现两遍 */
.card-content :deep(h1) {
  display: none;
}
.card-content :deep(p) {
  margin: 4px 0;
}
.card-content :deep(a) {
  color: var(--vp-c-brand);
}
.card-content :deep(img) {
  max-width: 100%;
}
.card-content :deep(pre) {
  margin: 8px 0;
  font-size: 11px;
  overflow: hidden;
}
.card-content :deep(code) {
  font-size: 11px;
}
.card-content :deep(ul),
.card-content :deep(ol) {
  margin: 4px 0;
  padding-left: 18px;
}

/* 两侧的「书」：底色更深、只显示标题、不拦截鼠标 */
.peek {
  background: var(--vp-c-bg-elv);
  pointer-events: none;
}
.peek-title {
  font-size: 16px;
}

/* 左右箭头按钮：垂直居中放在书架最外侧（卡片区域之外），互不重叠 */
.nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  width: 40px;
  height: 40px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 50%;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, opacity 0.2s;
}
.nav.prev { left: 0; }
.nav.next { right: 0; }
.nav:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.empty {
  color: var(--vp-c-text-2);
}
</style>
