---
# https://vitepress.dev/reference/default-theme-home-page

# 指定页面布局为「首页」模板（home 布局会渲染 hero 和 features 区域）
layout: home

# —— 顶部主视觉区（Hero）——
hero:
  # 主标题（大字号，显示在页面最上方）
  name: "橘子不爱吃番茄酱的碗"
  # 副标题（紧跟主标题下方，字号次之）
  text: ""
  # 标语/描述（hero 底部的灰色小字）
  tagline: "吃完饭就胡言乱语"
  # 按钮区（可放多个按钮）
  actions:
    - theme: brand        # brand 主题：实心主色按钮
      text: Markdown Examples   # 按钮文字
      link: /markdown-examples   # 点击跳转的链接
    - theme: alt          # alt 主题：描边/次要按钮
      text: API Examples
      link: /api-examples

# —— 特性展示区（Features）——
# 首页下半部分的三栏卡片，每项一个 title + details
features:
  - title: Feature A     # 卡片标题
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit   # 卡片描述
  - title: Feature B
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - title: Feature C
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
---

