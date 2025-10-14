import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({
        success: false,
        error: '缺少URL参数'
      }, { status: 400 })
    }

    console.log(`🎯 简单测试 - 抓取URL: ${url}`)

    // 尝试多种不同的调用方式
    const testMethods = [
      {
        name: 'MCP协议 - tools/list',
        config: {
          url: 'http://localhost:18060/mcp',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/list',
            params: {},
            id: 1
          })
        }
      },
      {
        name: 'MCP协议 - initialize',
        config: {
          url: 'http://localhost:18060/mcp',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: {
                name: 'test-client',
                version: '1.0.0'
              }
            },
            id: 1
          })
        }
      },
      {
        name: 'REST API - 根路径',
        config: {
          url: 'http://localhost:18060/',
          method: 'GET',
          headers: {}
        }
      },
      {
        name: 'REST API - health检查',
        config: {
          url: 'http://localhost:18060/health',
          method: 'GET',
          headers: {}
        }
      }
    ]

    const results = []

    for (const testMethod of testMethods) {
      try {
        console.log(`🔍 测试: ${testMethod.name}`)

        const response = await fetch(testMethod.config.url, {
          method: testMethod.config.method,
          headers: testMethod.config.headers,
          body: testMethod.config.body,
          signal: AbortSignal.timeout(10000) // 10秒超时
        })

        const responseText = await response.text()
        let responseData

        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = responseText
        }

        results.push({
          method: testMethod.name,
          status: response.status,
          ok: response.ok,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries())
        })

        console.log(`✅ ${testMethod.name}: ${response.status}`)

      } catch (error) {
        console.log(`❌ ${testMethod.name}: ${error}`)
        results.push({
          method: testMethod.name,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        url: url,
        timestamp: new Date().toISOString(),
        testResults: results
      },
      message: '测试完成'
    })

  } catch (error) {
    console.error('❌ 简单测试错误:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}