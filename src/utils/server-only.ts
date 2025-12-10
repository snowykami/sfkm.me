// server-only.ts
// 这是一个“服务端专用”模块示例：
// - 在服务器环境（Node / server component / route handler）中正常工作
// - 如果被客户端（浏览器）导入，会在模块解析阶段抛出错误，提醒开发者

if (typeof window !== 'undefined') {
  // 在浏览器中导入时直接抛错，能在运行时立刻提示问题。
  // 注意：这个检查会在客户端 bundle 执行模块时触发错误。
  throw new TypeError(
    '[server-only] This module is server-only and must not be imported from client code.',
  )
}

// 在这里导出仅可在服务端使用的函数/常量
export function getSecretServerValue() {
  // 仅在服务端调用，例如使用 process.env 或访问数据库
  return process.env.SECRET_API_KEY ?? '(no-secret)'
}

export async function callInternalService(path: string) {
  // 使用 fetch 在服务器端代理/调用内部 API
  const base = process.env.INTERNAL_API_BASE ?? 'http://127.0.0.1:3001'
  const res = await fetch(`${base}/${path}`)
  if (!res.ok)
    throw new Error(`Internal call failed: ${res.status}`)
  return res.json()
}
