import { NextRequest, NextResponse } from 'next/server'

interface ViewNoteRequest {
  note_id: string
  url?: string
  use_proxy?: boolean
  cookie?: string
}

// 代理开关环境变量
const ENABLE_XHS_PROXY = process.env.ENABLE_XHS_PROXY === 'true'

export async function POST(request: NextRequest) {
  try {
    const body: ViewNoteRequest = await request.json()
    const { note_id, url, use_proxy = false, cookie } = body

    if (!note_id && !url) {
      return NextResponse.json(
        { error: 'Missing note_id or url parameter' },
        { status: 400 }
      )
    }

    // 构建小红书链接
    const noteUrl = url || `https://www.xiaohongshu.com/explore/${note_id}`
    
    console.log(`📱 [View Note] 请求查看笔记: ${note_id}, URL: ${noteUrl}`)
    console.log(`🔧 [View Note] 代理开关: ${ENABLE_XHS_PROXY}, 用户请求代理: ${use_proxy}`)

    // 默认返回二维码方案
    const defaultResponse = {
      success: true,
      view_type: 'qrcode',
      data: {
        note_id,
        url: noteUrl,
        qr_code_url: noteUrl,
        message: '请使用小红书 App 扫描二维码查看原文',
        instructions: [
          '1. 打开小红书 App',
          '2. 点击右上角扫一扫',
          '3. 扫描下方二维码',
          '4. 即可查看完整内容'
        ]
      }
    }

    // 如果启用代理且用户请求代理，尝试代理方式
    if (ENABLE_XHS_PROXY && use_proxy) {
      try {
        console.log(`🌐 [View Note] 尝试代理方式获取内容`)
        
        const proxyResult = await fetchNoteViaProxy(noteUrl, cookie)
        
        if (proxyResult.success) {
          return NextResponse.json({
            success: true,
            view_type: 'proxy',
            data: {
              note_id,
              url: noteUrl,
              content: proxyResult.content,
              message: '成功获取笔记内容',
              fallback_qr: noteUrl
            }
          })
        } else {
          console.warn(`⚠️ [View Note] 代理方式失败，回退到二维码: ${proxyResult.error}`)
        }
      } catch (proxyError) {
        console.error(`❌ [View Note] 代理方式异常:`, proxyError)
      }
    }

    // 返回默认的二维码方案
    return NextResponse.json(defaultResponse)

  } catch (error: any) {
    console.error('View note API error:', error)
    return NextResponse.json(
      { error: 'Failed to process view request', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

// GET 方法兼容性
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const note_id = searchParams.get('note_id')
  const url = searchParams.get('url')
  const use_proxy = searchParams.get('use_proxy') === 'true'
  const cookie = searchParams.get('cookie')

  // 转换为 POST 请求
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      note_id,
      url,
      use_proxy,
      cookie
    })
  })

  return POST(postRequest)
}

// 代理方式获取笔记内容（实验性）
async function fetchNoteViaProxy(url: string, cookie?: string): Promise<{
  success: boolean
  content?: any
  error?: string
}> {
  try {
    // 使用移动端 User-Agent
    const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    
    const headers: Record<string, string> = {
      'User-Agent': mobileUA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }

    if (cookie) {
      headers['Cookie'] = cookie
    }

    console.log(`🌐 [Proxy] 发起请求: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      // 设置超时
      signal: AbortSignal.timeout(10000) // 10秒超时
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const html = await response.text()
    
    // 检查是否被重定向到二维码页面
    if (html.includes('扫码') || html.includes('qrcode') || html.includes('二维码')) {
      return {
        success: false,
        error: '页面要求扫码验证'
      }
    }

    // 简单解析页面内容
    const content = parseNoteContent(html)
    
    if (!content.title && !content.description) {
      return {
        success: false,
        error: '无法解析页面内容'
      }
    }

    return {
      success: true,
      content
    }

  } catch (error) {
    console.error(`❌ [Proxy] 请求失败:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络请求失败'
    }
  }
}

// 简单的 HTML 内容解析
function parseNoteContent(html: string): {
  title?: string
  description?: string
  images?: string[]
  author?: string
} {
  const content: any = {}

  // 提取标题
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    content.title = titleMatch[1].trim()
  }

  // 提取描述
  const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)
  if (descMatch) {
    content.description = descMatch[1].trim()
  }

  // 提取图片（简单实现）
  const imgMatches = html.match(/<img[^>]*src="([^"]+)"/gi)
  if (imgMatches) {
    content.images = imgMatches
      .map(match => {
        const srcMatch = match.match(/src="([^"]+)"/i)
        return srcMatch ? srcMatch[1] : null
      })
      .filter(Boolean)
      .slice(0, 5) // 最多5张图片
  }

  return content
}
