import { NextRequest } from 'next/server'

export async function extractXhsCookie(req: NextRequest) {
  console.log(`🔍 [extractXhsCookie] 处理请求: ${req.url}`)
  
  // 1) body 优先 - 需要克隆请求以避免消费body
  try {
    const clonedReq = req.clone()
    const data = await clonedReq.json().catch(() => null)
    if (data?.cookie) {
      console.log(`✅ [extractXhsCookie] 从body获取cookie，长度: ${data.cookie.length}`)
      return data.cookie as string
    }
  } catch (e) {
    console.log(`⚠️ [extractXhsCookie] 解析body失败: ${e}`)
  }
  
  // 2) 自定义请求头
  const fromHeader = req.headers.get('x-xhs-cookie')
  if (fromHeader) {
    console.log(`✅ [extractXhsCookie] 从header获取cookie，长度: ${fromHeader.length}`)
    return fromHeader
  }
  
  // 3) 环境变量兜底（用于本地调试或 Render 侧代理）
  if (process.env.XHS_COOKIE) {
    console.log(`✅ [extractXhsCookie] 从环境变量获取cookie，长度: ${process.env.XHS_COOKIE.length}`)
    return process.env.XHS_COOKIE
  }
  
  console.log(`❌ [extractXhsCookie] 未找到cookie`)
  return null
}
