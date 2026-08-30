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
    // translateY(-50%) 配合 .card-pos 的 top:50% 实现垂直居中
    transform: `translateX(calc(-50% + ${shift}%)) translateY(-50%) scale(${scale})`,
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
/* scoped：Vue 的样式隔离机制。加上它，这里写的每个选择器都会被 Vue
   自动补上一个 data-v-xxxx 标记，只对「本组件的元素」生效，
   不会影响其它组件或页面。这是 Vue 里 CSS 和普通 CSS 最大的区别。 */

/* ========== 最外层：整个横向文章列表所在的区块 ========== */
.post-carousel {
  margin: 0 auto;        /* 左右外边距 auto：让这个区块在页面里水平居中 */
  max-width: 1240px;     /* 最大宽度：屏幕再宽，内容也不超过 1240px */
  padding: 0 24px 80px;  /* 内边距：上 0 / 左右 24px / 下 80px（给下方按钮留空间） */
}

/* ========== 书架区域：所有卡片和箭头的定位参照 ========== */
.book {
  position: relative;   /* 相对定位：成为内部「绝对定位元素」的参照系 */
  height: 480px;        /* 固定高度：卡片垂直居中所用的空间 */
  max-width: 1160px;    /* 最大宽度：比外层窄一点，两侧留白 */
  margin: 0 auto;       /* 水平居中 */
}

/* ========== 卡片定位层：决定「每张卡片放在书架的哪个位置」 ==========
   top:50% + translateY(-50%)  → 垂直居中
   left:50% + translateX(-50%) → 水平居中（-50% 由 JS 的 cardStyle() 算）
   transform-origin: center center → 缩放时以卡片中心为基准，
   所以两侧小卡和中间大卡是「中心对齐」，而不是底边对齐。 */
.card-pos {
  position: absolute;    /* 绝对定位：脱离文档流，位置由 top/left 决定，相对 .book 定位 */
  top: 50%;              /* 上边线先放到 .book 垂直中点（配合 translateY(-50%) 才是真居中） */
  left: 50%;             /* 左边线先放到 .book 水平中点（配合 translateX(-50%) 才是真居中） */
  width: min(720px, 68vw); /* 宽度 = min(720px, 屏幕宽 68%)：窄屏时自动缩小 */
  height: 320px;         /* 卡片高度固定 320px */
  transform-origin: center center; /* 缩放时的基准点：卡片正中心 */
  transition: transform 0.4s ease; /* 位移/缩放变化时 0.4 秒平滑过渡，翻页不突兀 */
}

/* ========== 卡片本体：卡片长什么样 ========== */
.card {
  width: 100%;           /* 宽度占满 .card-pos */
  height: 100%;          /* 高度占满 .card-pos */
  padding: 24px;         /* 内边距：文字和卡片边缘之间留 24px 空 */
  border: 1px solid var(--vp-c-divider); /* 1px 实线描边，颜色用主题变量（分隔线色） */
  border-radius: 12px;   /* 圆角 12px：把四个直角变圆 */
  background: var(--vp-c-bg-soft); /* 背景色用主题变量（柔和底色，深/浅色模式自动适配） */
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06); /* 阴影：下移4px/模糊14px/6%黑，制造悬浮感 */
  transition: transform 0.4s ease, opacity 0.4s ease; /* 位移和透明度都平滑过渡 */
}

/* ========== 翻页进出场动画（配合模板里的 <Transition name="page">）==========
   Vue 的 <Transition> 在元素进入/离开时自动加这几类 class：
   -enter-from / -leave-to   → 动画「开始/结束」时的样子
   -enter-active / -leave-active → 动画进行中要过渡哪些属性
   外层 .card-pos 只做淡入淡出（opacity），内层 .card 负责上下位移（translateY）。 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.4s ease; /* 过渡目标是透明度，0.4 秒平滑变化 */
}
.page-enter-from,
.page-leave-to {
  opacity: 0;                    /* 开始进入时 / 离开结束时：完全透明 */
}
.page-enter-from .card {
  transform: translateY(24px);   /* 进入时卡片从下方 24px 处开始（像翻开出来） */
}
.page-leave-to .card {
  transform: translateY(-24px);  /* 离开时卡片向上 24px 移动（像合上） */
}

/* ========== 卡片里的文章标题 ========== */
.card-title {
  margin: 0 0 8px;   /* 外边距：上 0 / 左右 0 / 下 8px（和日期隔开一点） */
  font-size: 22px;   /* 字号 22px（比正文大，是标题） */
  font-weight: 600;  /* 字重 600（半粗体，介于正常 400 和粗体 700 之间） */
}

/* 标题本身是一个跳转链接 <a>：去掉链接默认的蓝色下划线，悬停时变主题色 */
.card-title a {
  color: var(--vp-c-text-1);   /* 文字色用主题变量（主文字色） */
  text-decoration: none;       /* 去掉下划线（链接默认带下划线） */
  transition: color 0.2s;      /* 颜色变化 0.2 秒平滑过渡 */
}
.card-title a:hover {
  color: var(--vp-c-brand);    /* 鼠标悬停时变成主题强调色 */
}

/* ========== 文章日期 ========== */
.card-date {
  font-size: 13px;             /* 小号字 */
  color: var(--vp-c-text-2);   /* 次要文字色（比正文浅一点，弱化存在感） */
}

/* ========== 文章缩小版预览区 ========== */
.card-content {
  margin-top: 12px;   /* 和上面的日期隔开 12px */
  max-height: 200px;  /* 最多显示 200px 高，超出部分不显示（防止整篇文章都塞进卡片） */
  overflow: hidden;   /* 超出 max-height 的内容裁掉（不出现滚动条） */
  font-size: 13px;    /* 小号字 */
  line-height: 1.6;   /* 行高 1.6 倍：行与行之间更舒展 */
  color: var(--vp-c-text-2); /* 次要文字色 */
  /* 底部渐隐（渐透明）：比硬生生截断更自然，暗示「下面还有内容」。
     mask-image 用一张「渐变图」盖在元素上，按渐变的透明度把内容遮住/露出。
     linear-gradient(to bottom, #000 60%, transparent 100%) 表示从上到下：
     前 60% 完全不透明（黑色 #000 → 完全露出），后 40% 逐渐变透明 → 内容淡出。
     -webkit-mask-image 是旧浏览器的前缀写法，mask-image 是标准写法，两个都写为了兼容。 */
  -webkit-mask-image: linear-gradient(to bottom, #000 60%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 60%, transparent 100%);
}

/* ========== v-html 注入的文章内容（h1/p/pre/img 等）==========
   这些内容不是本组件的标签，身上没有 data-v 标记，普通 scoped 选择器打不到，
   必须用 :deep() 穿透进内部才能给它们套样式。
   这里统一把字号改小，让卡片看起来像「文章的缩小版」。 */
.card-content :deep(h1),
.card-content :deep(h2),
.card-content :deep(h3),
.card-content :deep(h4) {
  margin: 10px 0 4px;  /* 标题上下留白：上 10px / 下 4px */
  font-size: 15px;     /* 小标题字号压到 15px */
  line-height: 1.4;    /* 行高 1.4 倍 */
}
/* 文章里的第一个一级标题（# 大标题）通常和卡片自己的标题重复，直接隐藏，避免出现两遍 */
.card-content :deep(h1) {
  display: none;       /* 不显示：元素还在 DOM 里，但视觉上消失、不占空间 */
}
.card-content :deep(p) {
  margin: 4px 0;       /* 段落上下留白 4px（缩小版里段落挤一点，更紧凑） */
}
.card-content :deep(a) {
  color: var(--vp-c-brand); /* 文章里的链接统一用主题色 */
}
.card-content :deep(img) {
  max-width: 100%;     /* 图片最大宽度 = 卡片宽度，防止大图把卡片撑破 */
}
.card-content :deep(pre) {
  margin: 8px 0;       /* 代码块上下留白 */
  font-size: 11px;     /* 代码字再小一号 */
  overflow: hidden;    /* 超长的代码行裁掉，不出现横向滚动条 */
}
.card-content :deep(code) {
  font-size: 11px;     /* 行内代码也用小字号 */
}
.card-content :deep(ul),
.card-content :deep(ol) {
  margin: 4px 0;          /* 列表上下留白 */
  padding-left: 18px;     /* 左侧缩进 18px：给项目符号（圆点/数字）留出位置 */
}

/* ========== 两侧的「书」（非当前文章的小卡片）==========
   底色更深、只显示标题、不拦截鼠标（点了没反应，翻页靠箭头）。 */
.peek {
  background: var(--vp-c-bg-elv); /* 更深的背景色（主题变量，浮层色） */
  pointer-events: none;  /* 鼠标事件穿透：让这个元素「点不到」（不挡后面的东西） */
}
.peek-title {
  font-size: 16px;       /* 侧卡标题比中间卡小 */
}

/* ========== 左右箭头按钮（上一页/下一页）==========
   垂直居中放在书架最外侧（卡片区域之外），互不重叠。 */
.nav {
  position: absolute;    /* 绝对定位：相对 .book 定位 */
  top: 50%;              /* 上边线先放到 .book 垂直中点 */
  transform: translateY(-50%); /* 再向上移自身一半高度 → 真正的垂直居中 */
  z-index: 50;           /* 层级：压在卡片上面，不被卡片盖住 */
  width: 40px;           /* 按钮宽 40px */
  height: 40px;          /* 按钮高 40px（宽高相等 → 正方形） */
  border: 1px solid var(--vp-c-divider); /* 1px 描边 */
  border-radius: 50%;    /* 圆角 50%：正方形加 50% 圆角 → 正圆 */
  background: var(--vp-c-bg);   /* 背景用页面底色 */
  color: var(--vp-c-text-1);    /* 箭头字符用主文字色 */
  font-size: 22px;       /* 箭头符号的字号 */
  line-height: 1;        /* 行高 1：防止箭头字符被行高挤出圆形按钮 */
  cursor: pointer;       /* 鼠标悬停变成手型（暗示可以点击） */
  transition: border-color 0.2s, color 0.2s, opacity 0.2s; /* 悬停变色时平滑过渡 */
}
.nav.prev { left: 0; }   /* 上一个按钮：贴在 .book 最左边 */
.nav.next { right: 0; }  /* 下一个按钮：贴在 .book 最右边 */
.nav:hover {
  border-color: var(--vp-c-brand); /* 悬停：边框变主题色 */
  color: var(--vp-c-brand);        /* 悬停：箭头变主题色 */
}

/* ========== 没有文章时的提示文字 ========== */
.empty {
  color: var(--vp-c-text-2); /* 次要文字色（浅一点，弱提示） */
}
</style>
