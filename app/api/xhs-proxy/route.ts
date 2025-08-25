import { NextRequest, NextResponse } from 'next/server'
import { extractXhsCookie } from './_utils'

export async function POST(request: NextRequest) {
  try {
    console.log(`🔍 [XHS-Proxy] POST请求开始处理`)
    
    // 获取请求体数据
    const body = await request.json()
    const { keyword, cookie, limit = 10, days = 7 } = body
    
    console.log(`📝 [XHS-Proxy] 请求参数: keyword=${keyword}, limit=${limit}, days=${days}`)
    console.log(`🍪 [XHS-Proxy] body中cookie长度: ${cookie ? cookie.length : 0}`)
    
    // 提取Cookie
    const xhsCookie = await extractXhsCookie(request)
    
    if (!xhsCookie) {
      console.log(`❌ [XHS-Proxy] 缺少cookie，来源页面: ${request.headers.get('referer')}`)
      return NextResponse.json({ 
        demo: true, 
        reason: 'missing_cookie',
        url: request.url,
        referer: request.headers.get('referer')
      }, { status: 400 })
    }
    
    console.log(`✅ [XHS-Proxy] 获取到cookie，长度: ${xhsCookie.length}`)
    
    // 调用FastAPI后端
    const fastApiUrl = process.env.XHS_API_BASE_URL || 'http://localhost:8000'
    console.log(`🚀 [XHS-Proxy] 调用FastAPI: ${fastApiUrl}/search`)
    
    const response = await fetch(`${fastApiUrl}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        keyword: keyword, 
        page_size: limit, 
        cookies: xhsCookie 
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [XHS-Proxy] FastAPI响应错误: ${response.status}, ${errorText}`)
      throw new Error(`FastAPI响应错误: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log(`✅ [XHS-Proxy] FastAPI返回数据状态: ${data.status}`)
    
    return NextResponse.json({
      success: true,
      data: data,
      source: 'fastapi',
      cookieSource: 'body',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🚨 [XHS-Proxy] 错误:', error)
    
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
  const keyword = searchParams.get('keyword') || '美食'
  const limit = parseInt(searchParams.get('limit') || '10')
  const days = parseInt(searchParams.get('days') || '7')
  
  // 创建一个新的Request对象用于POST
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ keyword, limit, days })
  })
  
  return POST(postRequest)
}