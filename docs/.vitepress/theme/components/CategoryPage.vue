<!--
  CategoryPage.vue —— 分类页的文章列表
  每个分类页（/categories/分类名）都会渲染这个组件：
    1. 从路由参数里拿到当前分类名
    2. 从 categories.data 里找到这个分类下的所有文章
    3. 把文章标题逐行列出来，每行是一张可整行点击的「行卡片」（悬停变底色、标题变主题色），点整行进入文章
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
    <!-- 每一条是一篇文章 -->
    <li v-for="post in posts" :key="post.url" class="category-post-item">
      <!-- 整行 <a> 就是一张可点击的「行卡片」：左侧放标题（下方可选日期），
           右侧放箭头。悬停时整行变底色、标题变主题色、箭头从右滑出。
           withBase() 给 url 补上 /CraftBlog/ 前缀，否则会 404。 -->
      <a :href="withBase(post.url)" class="category-post-link">
        <span class="post-main">
          <span class="post-title">{{ post.title }}</span>
          <!-- v-if="post.date"：文章写了日期才显示日期那一行 -->
          <time v-if="post.date" class="post-date">{{ post.date }}</time>
        </span>
        <!-- 悬停滑出的箭头；aria-hidden 让读屏器跳过这个纯装饰符号 -->
        <span class="post-arrow" aria-hidden="true">→</span>
      </a>
    </li>
  </ul>

  <!-- 该分类下没有文章时的提示 -->
  <p v-else class="category-post-empty">该分类下暂无文章</p>
</template>

<style scoped>
/* scoped：样式只对本组件的元素生效，不会影响其它组件或页面 */

/* 分类名标题：大一点的字号，和文章列表隔开 */
.category-heading {
  margin: 0 0 64px;          /* 外边距：上 0 / 左右 0 / 下 32px（把标题和下面的卡片列表隔开） */
  font-size: 36px;           /* 标题字号（比文章标题大） */
  font-weight: 700;          /* 粗体 */
  color: var(--vp-c-text-1); /* 主文字色 */
} 

/* 列表容器：去掉默认的圆点；用行间距（gap）代替原来的分隔线，
   让每一行变成独立的圆角卡片块，更干净 */
.category-post-list {
  list-style: none;            /* 去掉列表默认的项目符号（圆点） */
  margin: 0;                   /* 去掉默认外边距 */
  padding: 0;                  /* 去掉默认内边距 */
  display: flex;               /* 弹性布局：条目纵向排列 */
  flex-direction: column;      /* 主轴方向：从上到下（竖排） */
  gap: 16px;                    /* 行与行（卡片之间）留 8px 间距，让每张卡片之间有清晰的空隙 */
}

/* 每个 <li> 本身不画样式，「行卡片」是里面的 <a>（.category-post-link） */
.category-post-item {
  margin: 0;                   /* 去掉 <li> 默认外边距 */
}

/* 行卡片 <a>：占满整行、整行可点击。
   「平时就显示成一张浅色小卡片」：柔和底色 + 细描边 + 淡淡的阴影，
   这样整片列表有内容感，不会只剩一行行干文字。
   position: relative：作为右侧箭头（absolute 定位）的参照点 */
.category-post-link {
  position: relative;          /* 相对定位：内部绝对定位的箭头以它为参照 */
  display: block;              /* 块级：占满整行宽度 */
  padding: 14px 18px;          /* 内边距：上下 14px / 左右 18px，撑出卡片高度和呼吸感 */
  border-radius: 10px;         /* 圆角：卡片是圆角矩形 */
  background: var(--vp-c-bg-soft);  /* 平时底色：主题「柔和底色」（浅色=淡灰，深色=暗灰） */
  border: 1px solid var(--vp-c-divider); /* 1px 细描边，让卡片边缘更清晰 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04); /* 平时淡淡的阴影：让卡片微微立起来 */
  text-decoration: none;       /* 去掉链接默认的下划线 */
  transition: background-color 0.2s, box-shadow 0.2s, border-color 0.2s; /* 这些属性变化时 0.2 秒平滑过渡 */
}
/* 悬停（选中感）：底色提亮成「浮起色」，阴影加深、范围变大，
   像卡片被鼠标「拿起」了一层 */
.category-post-link:hover {
  background: var(--vp-c-bg-elv);   /* 主题「浮起色」（浅色=更白，深色=更浅的灰） */
  border-color: var(--vp-c-divider); /* 描边维持原来的分隔线色即可 */
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1); /* 悬停阴影：下移更多、更明显 */
}
/* 键盘 Tab 聚焦到这一行时也画出描边，方便纯键盘用户看清选中位置 */
.category-post-link:focus-visible {
  outline: 2px solid var(--vp-c-brand); /* 主题色描边 */
  outline-offset: 2px;                  /* 描边和元素之间留 2px，别贴着边 */
}

/* 标题 + 日期的容器（行卡片左侧的文字区） */
.post-main {
  display: block;              /* 块级：占满卡片可用宽度（箭头改成绝对定位后不再和它并排） */
}

/* 文章标题：正常是主文字色，悬停整行时变主题色 */
.post-title {
  display: block;              /* 块级：日期才能排到它下面 */
  font-size: 16px;             /* 标题字号 */
  font-weight: 600;            /* 字重 600（半粗体） */
  line-height: 1.5;            /* 行高 1.5：标题折行时行与行之间更舒展 */
  color: var(--vp-c-text-1);   /* 主文字色（正常黑/白） */
  transition: color 0.2s;      /* 变色时 0.2 秒平滑过渡 */
}
.category-post-link:hover .post-title {
  color: var(--vp-c-brand);    /* 悬停整行时标题变成主题强调色 */
}

/* 日期：小号、次要颜色，放在标题下方。文章没写 date 就不渲染 */
.post-date {
  display: block;              /* 独占一行 */
  margin-top: 3px;             /* 和标题隔开 3px */
  font-size: 13px;             /* 小号字 */
  color: var(--vp-c-text-2);   /* 次要文字色（比正文浅一点） */
}

/* 右侧箭头：平时隐藏，悬停时在卡片右边缘滑出。
   用 absolute 定位到卡片右端垂直居中，不占布局位置，
   所以平时不会在右侧留出一块空白（减少「空」的感觉）。 */
.post-arrow {
  position: absolute;          /* 绝对定位：脱离文档流，位置由 top/right 决定，相对 .category-post-link 定位 */
  top: 50%;                    /* 上边线先放到卡片垂直中点（配合 translateY(-50%) 才是真居中） */
  right: 16px;                 /* 距卡片右边缘 16px */
  color: var(--vp-c-brand);    /* 主题色箭头 */
  font-size: 16px;             /* 箭头字符大小 */
  opacity: 0;                  /* 平时看不见 */
  transform: translateY(-50%) translateX(-4px); /* 垂直居中 + 平时在最终位置左侧 4px（准备向右滑入） */
  transition: opacity 0.2s, transform 0.2s; /* 淡入 + 平移两件事同时平滑过渡 */
}
.category-post-link:hover .post-arrow {
  opacity: 1;                  /* 悬停时可见 */
  transform: translateY(-50%) translateX(0); /* 保持在垂直居中位置、水平滑到最终位置 */
}

/* 空分类的提示文字 */
.category-post-empty {
  color: var(--vp-c-text-2);   /* 次要文字色（弱提示） */
}
</style>
