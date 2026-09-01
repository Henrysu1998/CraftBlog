// supabase.config.ts —— Supabase 项目配置（浏览量统计功能要用）
//
// 需要你去 https://supabase.com 注册并创建一个免费项目，然后：
//   1. 在项目的 SQL Editor 里运行仓库根目录的 supabase-setup.sql（建表 + 函数）
//   2. 在项目 Settings → API 页面，复制下面两个值，填到对应常量里：
//        Project URL   →  SUPABASE_URL
//        anon public   →  SUPABASE_ANON_KEY
//
// 说明：anon 是「公开的匿名密钥」，浏览器每次访问都会带上它，本来就不是秘密；
// 数据安全靠 Supabase 的 RLS 策略（在 supabase-setup.sql 里配置），而不是 key 保密。
// 脚本里已把匿名权限收到最小：只能读 article_views 表、调用 increment_view（只能 +1），
// 改不了别的数据，也动不了数据库结构。真正的管理员密钥（Service Role key）不会出现在前端。
// 所以这两个值可以直接提交进仓库，GitHub Actions 构建时也能正常用。
//
// 填好之前，这个功能会静默关闭：不统计浏览量、首页书架显示「暂无文章」。
// 填好之后保存即可生效，不用改其它代码。

// 项目地址，形如 https://xxxxxx.supabase.co
export const SUPABASE_URL = 'https://hcdjhwybydshmwlryuee.supabase.co'

// 匿名公开密钥，以 eyJ 开头的一长串字符
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZGpod3lieWRzaG13bHJ5dWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTg5MjIsImV4cCI6MjEwMzgzNDkyMn0.6wJ1fy-9eFM4XCvfw6Ul8LyZjvM8ZLWafRXAqgGtx9Y'
