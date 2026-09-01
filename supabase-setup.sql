-- ============================================================
-- supabase-setup.sql —— 浏览量统计功能需要的数据库结构
--
-- 使用方法：
--   1. 打开 https://supabase.com 并登录，创建一个免费项目
--   2. 进入项目的 SQL Editor（左侧菜单）
--   3. 把下面的内容整段复制粘贴进去，点 Run 执行
--
-- 这段脚本做三件事：
--   1. 建一张表 article_views：一行一篇文章，记录 path（路径）和 count（浏览量）
--   2. 开启行级安全（RLS），并只给匿名用户（浏览器前端用的 anon key）
--      「读取」权限 —— 首页要查 top-K 排名
--   3. 建一个原子自增函数 increment_view：首次访问插入 count=1，之后每次 +1
--
-- ============================================================
-- 【安全性说明 —— 为什么 key 公开也不怕】
--   anon key 本来就会出现在每个访问者的浏览器里，藏不住；
--   保护数据靠的是 RLS，而不是 key 保密。
--   这个脚本严格控制了匿名用户能做什么：
--     ✓ 能读 article_views（查排名要用）
--     ✓ 能调用 increment_view（只能让 count +1）
--     ✗ 不能直接改/删 article_views 里的任何一行（不开放 insert/update/delete）
--     ✗ 不能读/改其它任何表
--     ✗ 不能删表、建表、改数据库结构
--   真正的管理员密钥（Service Role key）永远不会出现在前端。
-- ============================================================

-- ---------- 1. 建表 ----------
-- path 是文章路径（主键，一篇文章一行），如 /api-examples.html
-- count 是浏览量，默认从 0 开始
create table if not exists public.article_views (
  path  text    primary key,
  count bigint  not null default 0
);

-- ---------- 2. 行级安全（RLS）----------
-- 开启后，默认谁都读不了、写不了，必须靠下面的策略放行
alter table public.article_views enable row level security;

-- 只给匿名用户「读取」权限：首页要查 top-K 排名。
-- 注意：不建 insert / update / delete 策略，所以匿名用户没法直接改这张表。
create policy "anon 可读" on public.article_views
  for select using (true);

-- ---------- 3. 原子自增函数 ----------
-- 作用：给指定文章 +1 次浏览量。
-- 原理：先尝试插入一行（count=1）；如果这篇文章已经有行了，
--       就把 count 加 1。放在数据库里一次性完成，避免「先读再写」的竞争问题。
-- security definer：函数以「建表者」的身份执行，能正常读写表，
--   但函数体内的 SQL 是写死的（只能 +1），调用者没法借它改出别的值。
create or replace function public.increment_view(target_path text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.article_views (path, count)
  values (target_path, 1)
  on conflict (path) do update set count = public.article_views.count + 1;
$$;

-- 允许匿名用户执行这个函数（这是匿名用户唯一能写的入口，且只能 +1）
grant execute on function public.increment_view(text) to anon;
