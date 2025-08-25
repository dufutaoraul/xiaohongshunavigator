import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { cookie } = await request.json()

    if (!cookie || typeof cookie !== 'string' || cookie.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: '请提供有效的 Cookie' },
        { status: 400 }
      )
    }

    // 调用后端服务验证 Cookie
    const backendUrl = process.env.XHS_BACKEND_URL || 'http://localhost:8000'
    
    const response = await fetch(`${backendUrl}/check_cookie`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cookie: cookie.trim() })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      return NextResponse.json({
        success: true,
        message: 'Cookie 验证成功'
      })
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: result.message || 'Cookie 验证失败，请检查 Cookie 是否正确' 
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Cookie 验证错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器错误，请稍后重试' 
      },
      { status: 500 }
    )
  }
}