import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DIFY DEBUG ENDPOINT CALLED ===')
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        hasDifyUrl: !!process.env.DIFY_API_URL,
        hasDifyKey: !!process.env.DIFY_API_KEY,
        difyUrl: process.env.DIFY_API_URL || 'NOT_SET',
        // 不要暴露完整的API密钥，只显示前几位
        difyKeyPreview: process.env.DIFY_API_KEY ? `${process.env.DIFY_API_KEY.substring(0, 8)}...` : 'NOT_SET'
      },
      nodeVersion: process.version,
      platform: process.platform
    }

    console.log('Debug info:', debugInfo)
    
    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Debug endpoint failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== DIFY DEBUG POST TEST ===')
    
    const body = await request.json()
    console.log('Received body:', JSON.stringify(body, null, 2))

    // 检查环境变量
    if (!process.env.DIFY_API_URL || !process.env.DIFY_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Dify environment variables not configured',
        environment: {
          hasDifyUrl: !!process.env.DIFY_API_URL,
          hasDifyKey: !!process.env.DIFY_API_KEY
        }
      })
    }

    // 构建测试请求
    const testRequestBody = {
      inputs: {
        persona: body.persona || "测试人设",
        keywords: body.keywords || "测试关键词",
        vision: body.vision || "测试愿景", 
        user_input: body.user_input || "测试输入",
        angle: body.angle || "efficiency",
        day_number: body.day_number || 1
      },
      response_mode: "blocking",
      user: body.user || "debug_user"
    }

    console.log('Sending to Dify:', JSON.stringify(testRequestBody, null, 2))
    console.log('Dify URL:', process.env.DIFY_API_URL)

    // 发送请求到Dify
    const startTime = Date.now()
    const difyResponse = await fetch(process.env.DIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`
      },
      body: JSON.stringify(testRequestBody)
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    console.log('Dify response status:', difyResponse.status)
    console.log('Dify response headers:', Object.fromEntries(difyResponse.headers.entries()))
    console.log('Response time:', responseTime, 'ms')

    let responseData
    let responseText = ''
    
    try {
      responseText = await difyResponse.text()
      console.log('Raw response text:', responseText)
      
      if (responseText) {
        responseData = JSON.parse(responseText)
        console.log('Parsed response data:', JSON.stringify(responseData, null, 2))
      }
    } catch (parseError) {
      console.error('Failed to parse Dify response:', parseError)
      return NextResponse.json({
        success: false,
        error: 'Failed to parse Dify response',
        details: {
          status: difyResponse.status,
          statusText: difyResponse.statusText,
          responseTime,
          rawResponse: responseText,
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        }
      })
    }

    // 分析响应结构
    const analysis = {
      status: difyResponse.status,
      statusText: difyResponse.statusText,
      responseTime,
      success: difyResponse.ok,
      dataStructure: responseData ? {
        keys: Object.keys(responseData),
        hasData: !!responseData.data,
        hasAnswer: !!responseData.answer,
        hasContent: !!responseData.content,
        dataKeys: responseData.data ? Object.keys(responseData.data) : null,
      } : null,
      rawResponse: responseData
    }

    console.log('Final analysis:', JSON.stringify(analysis, null, 2))

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('Dify debug test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Dify debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}