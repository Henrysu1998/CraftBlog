// supabase.ts —— Supabase 工具函数（浏览量统计）
// 负责三件事：
//   1. getClient()          —— 创建客户端（懒加载，只有用到才创建）
//   2. incrementView(path)  —— 给一篇指定文章的浏览量 +1（原子自增）
//   3. fetchTopPosts(n)     —— 查询浏览量最高的前 n 篇文章（路径 + 浏览量数字）
//
// 未配置（supabase.config.ts 里常量为空）时，函数全部安全降级：
//   getClient 返回 null、其它函数返回空结果，功能静默关闭，不报错。

// createClient：Supabase 官方提供的客户端创建函数
import { createClient } from '@supabase/supabase-js'
// 项目配置（URL 和匿名密钥），需要你先填好
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase.config'

// 缓存客户端，避免每次调用都新建（新建会重复初始化内部状态）。
// 用 any 类型：这里只用到最基础的查询，不需要精确的 TS 类型。
let client: any = null

// getClient：懒创建客户端。
// 配置没填好（常量为空）就返回 null，调用方据此跳过，不发起网络请求。
export function getClient() {
  // 任意一个常量为空都算「未配置」
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  // 只创建一次，之后复用
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return client
}

// incrementView：给指定文章路径的浏览量 +1。
// 走数据库函数 increment_view（在 supabase-setup.sql 里建）做「插入或自增」的
// 原子操作：首次访问插入一行 count=1，之后每次访问 count+1。
// 参数 path 形如 /api-examples.html（不带 base 前缀）。
export async function incrementView(path: string) {
  const supabase = getClient()
  if (!supabase) return
  await supabase.rpc('increment_view', { target_path: path })
}

// 一篇「浏览量排进 top-K」的文章：url 是文章路径，count 是它的浏览量数字。
// 导出这个接口，让组件（PostCarousel.vue）能拿到类型，编辑器会提示字段名。
export interface TopPost {
  url: string    // 文章路径（不带 base 前缀），如 /api-examples.html
  count: number  // 浏览量数字
}

// fetchTopPosts：按浏览量倒序取前 limit 篇文章（路径 + 浏览量），供首页书架使用。
// 返回 TopPost[]（排好序）；查询失败返回空数组（不抛异常，让界面走「暂无文章」状态）。
export async function fetchTopPosts(limit: number): Promise<TopPost[]> {
  const supabase = getClient()
  if (!supabase) return []

  // from('article_views')：查浏览量表；select('path, count')：要路径和浏览量两列
  // order('count', { ascending: false })：按浏览量从高到低排
  // limit(limit)：只要前 limit 条
  const { data, error } = await supabase
    .from('article_views')
    .select('path, count')
    .order('count', { ascending: false })
    .limit(limit)

  // 出错（比如网络异常、表还没建）就返回空数组，界面显示「暂无文章」而不是崩溃
  if (error) return []

  // 把查询结果加工成 TopPost[] 数组返回。
  // 注意 count 是数据库里的 bigint 类型，接口返回时可能被当作字符串（比如 "5"），
  // 用 Number() 统一转成数字，避免组件里当数值用出错。
  return (data ?? []).map((row: { path: string; count: string | number }) => ({
    url: row.path,
    count: Number(row.count)
  }))
}
