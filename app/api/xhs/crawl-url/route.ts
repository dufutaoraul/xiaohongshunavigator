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

    console.log(`🎯 开始抓取URL: ${url}`)

    // 直接调用MCP服务的HTTP API - 尝试多种可能的方法
    try {
      // 方法1: 尝试tools/call调用
      let mcpResponse = await fetch('http://localhost:18060/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_profile_info',
            arguments: {
              url: url
            }
          },
          id: 1
        }),
        signal: AbortSignal.timeout(30000)
      })

      // 如果失败，尝试方法2: 直接调用get_profile_info
      if (!mcpResponse.ok || mcpResponse.status === 400) {
        console.log('🔄 尝试方法2: 直接调用get_profile_info')
        mcpResponse = await fetch('http://localhost:18060/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'get_profile_info',
            params: {
              url: url
            },
            id: 1
          }),
          signal: AbortSignal.timeout(30000)
        })
      }

      // 如果还是失败，尝试方法3: 使用user_profile
      if (!mcpResponse.ok || mcpResponse.status === 400) {
        console.log('🔄 尝试方法3: 使用user_profile')
        mcpResponse = await fetch('http://localhost:18060/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'user_profile',
            params: [url],
            id: 1
          }),
          signal: AbortSignal.timeout(30000)
        })
      }

      if (!mcpResponse.ok) {
        throw new Error(`MCP服务响应错误: ${mcpResponse.status}`)
      }

      const mcpData = await mcpResponse.json()

      if (mcpData.error) {
        throw new Error(`MCP调用错误: ${mcpData.error.message || mcpData.error}`)
      }

      console.log('✅ MCP调用成功:', mcpData.result)

      return NextResponse.json({
        success: true,
        data: mcpData.result,
        message: '成功获取页面数据'
      })

    } catch (mcpError) {
      console.error('❌ MCP调用失败:', mcpError)

      // 如果MCP服务不可用，尝试直接调用端口18060的其他端点
      try {
        console.log('🔄 尝试调用备用端点...')

        // 备用方法1: 尝试REST API
        let backupResponse = await fetch(`http://localhost:18060/api/v1/profile?url=${encodeURIComponent(url)}`, {
          method: 'GET',
          signal: AbortSignal.timeout(30000)
        })

        // 备用方法2: 尝试另一个端点
        if (!backupResponse.ok) {
          backupResponse = await fetch(`http://localhost:18060/crawl`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url }),
            signal: AbortSignal.timeout(30000)
          })
        }

        // 备用方法3: 尝试简单的用户信息端点
        if (!backupResponse.ok) {
          backupResponse = await fetch(`http://localhost:18060/user/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile_url: url }),
            signal: AbortSignal.timeout(30000)
          })
        }

        if (backupResponse.ok) {
          const backupData = await backupResponse.json()
          console.log('✅ 备用端点调用成功')

          return NextResponse.json({
            success: true,
            data: backupData,
            message: '通过备用端点成功获取数据'
          })
        }
      } catch (backupError) {
        console.error('❌ 备用端点也失败:', backupError)
      }

      return NextResponse.json({
        success: false,
        error: 'MCP服务调用失败',
        message: `无法连接到MCP服务: ${mcpError instanceof Error ? mcpError.message : '未知错误'}`,
        debug: {
          mcpError: mcpError instanceof Error ? mcpError.message : mcpError,
          url: url
        }
      }, { status: 503 })
    }

  } catch (error) {
    console.error('❌ API错误:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}