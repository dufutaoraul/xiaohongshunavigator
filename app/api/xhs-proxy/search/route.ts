import { NextRequest, NextResponse } from 'next/server'
import { extractXhsCookie } from '../_utils'

export async function POST(request: NextRequest) {
  try {
    console.log(`🔍 [XHS-Proxy-Search] POST请求开始处理`)
    
    // 获取请求体数据
    const body = await request.json()
    const { keyword = '美食', q = keyword, limit = 10, page_size = limit, days = 7, cookie, page = 1, sort = 'general' } = body
    
    console.log(`📝 [XHS-Proxy-Search] 请求参数: keyword=${keyword}, q=${q}, limit=${limit}, page_size=${page_size}, page=${page}, sort=${sort}`)
    console.log(`🍪 [XHS-Proxy-Search] body中cookie长度: ${cookie ? cookie.length : 0}`)
    
    // 直接从body中获取Cookie，不使用工具函数
    let xhsCookie = cookie
    
    // 如果body中没有cookie，尝试其他来源
    if (!xhsCookie) {
      const fromHeader = request.headers.get('x-xhs-cookie')
      if (fromHeader) {
        console.log(`✅ [XHS-Proxy-Search] 从header获取cookie，长度: ${fromHeader.length}`)
        xhsCookie = fromHeader
      } else if (process.env.XHS_COOKIE) {
        console.log(`✅ [XHS-Proxy-Search] 从环境变量获取cookie，长度: ${process.env.XHS_COOKIE.length}`)
        xhsCookie = process.env.XHS_COOKIE
      }
    }
    
    if (!xhsCookie) {
      console.log(`❌ [XHS-Proxy-Search] 缺少cookie，来源页面: ${request.headers.get('referer')}`)
      return NextResponse.json({ 
        demo: true, 
        reason: 'missing_cookie',
        url: request.url,
        referer: request.headers.get('referer')
      }, { status: 400 })
    }
    
    console.log(`✅ [XHS-Proxy-Search] 获取到cookie，长度: ${xhsCookie.length}`)
    
    // 调用FastAPI后端
    const fastApiUrl = process.env.XHS_API_BASE_URL || 'http://localhost:8002'
    console.log(`🚀 [XHS-Proxy-Search] 调用FastAPI: ${fastApiUrl}/search`)
    
    const response = await fetch(`${fastApiUrl}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        keyword: keyword || q, 
        page: page,
        page_size: page_size || limit,
        sort: sort,
        cookie: xhsCookie 
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [XHS-Proxy-Search] FastAPI响应错误: ${response.status}, ${errorText}`)
      throw new Error(`FastAPI响应错误: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log(`✅ [XHS-Proxy-Search] FastAPI返回数据状态: ${data.status}`)
    
    return NextResponse.json({
      success: true,
      data: data,
      source: 'fastapi',
      cookieSource: 'body',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🚨 [XHS-Proxy-Search] 错误:', error)
    
    // 透传错误而不是静默降级
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      source: 'error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// 保持GET兼容性，但重定向到POST
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || '美食'
  const limit = parseInt(searchParams.get('limit') || '10')
  const days = parseInt(searchParams.get('days') || '7')
  
  // 创建一个新的Request对象用于POST
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ q, limit, days })
  })
  
  return POST(postRequest)
}