import { NextRequest, NextResponse } from 'next/server'

// MCP会话管理
let mcpSessionInitialized = false
let availableTools: any[] = []

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

    console.log(`🎯 按官方文档抓取URL: ${url}`)

    // 步骤1: 初始化MCP会话（如果还没初始化）
    if (!mcpSessionInitialized) {
      try {
        console.log('🔧 正在初始化MCP会话...')
        const initResponse = await fetch('http://localhost:18060/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {}
              },
              clientInfo: {
                name: 'xiaohongshu-web-client',
                version: '1.0.0'
              }
            },
            id: 1
          }),
          signal: AbortSignal.timeout(10000)
        })

        if (!initResponse.ok) {
          throw new Error(`初始化失败: HTTP ${initResponse.status}`)
        }

        const initData = await initResponse.json()
        console.log('✅ MCP会话初始化成功:', initData)
        mcpSessionInitialized = true

        // 步骤2: 获取可用工具列表
        console.log('📋 获取可用工具列表...')
        const toolsResponse = await fetch('http://localhost:18060/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/list',
            params: {},
            id: 2
          }),
          signal: AbortSignal.timeout(10000)
        })

        if (toolsResponse.ok) {
          const toolsData = await toolsResponse.json()
          availableTools = toolsData.result?.tools || []
          console.log('✅ 可用工具:', availableTools.map((t: any) => t.name))
        }

      } catch (initError) {
        console.error('❌ MCP初始化失败:', initError)
        return NextResponse.json({
          success: false,
          error: 'MCP初始化失败',
          message: initError instanceof Error ? initError.message : '未知错误'
        }, { status: 503 })
      }
    }

    // 步骤3: 先检查登录状态
    console.log('🔐 检查登录状态...')
    try {
      const loginResponse = await fetch('http://localhost:18060/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'check_login_status',
            arguments: {}
          },
          id: 3
        }),
        signal: AbortSignal.timeout(10000)
      })

      if (loginResponse.ok) {
        const loginData = await loginResponse.json()
        console.log('🔐 登录状态检查结果:', loginData)

        if (loginData.result) {
          console.log('✅ 登录状态工具调用成功')
        }
      }
    } catch (loginError) {
      console.log('❌ 登录状态检查失败:', loginError)
    }

    // 步骤4: 尝试调用正确的工具获取帖子详情
    // 注意：get_feed_detail可能需要帖子URL，而不是用户主页URL
    console.log('📊 尝试获取内容详情...')
    try {
      const feedResponse = await fetch('http://localhost:18060/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_feed_detail',
            arguments: {
              url: url,
              feed_url: url,
              post_url: url
            }
          },
          id: 4
        }),
        signal: AbortSignal.timeout(30000)
      })

      if (feedResponse.ok) {
        const feedData = await feedResponse.json()

        if (feedData.error) {
          console.log('❌ get_feed_detail返回错误:', feedData.error)
        } else if (feedData.result) {
          console.log('✅ get_feed_detail调用成功!')
          return NextResponse.json({
            success: true,
            data: {
              tool_used: 'get_feed_detail',
              result: feedData.result,
              available_tools: availableTools.map(t => t.name)
            },
            message: '通过get_feed_detail成功获取数据'
          })
        }
      } else {
        console.log(`❌ get_feed_detail调用失败: HTTP ${feedResponse.status}`)
      }
    } catch (feedError) {
      console.log('❌ get_feed_detail调用异常:', feedError)
    }

    // 如果所有工具都失败了，返回诊断信息
    return NextResponse.json({
      success: false,
      error: '工具调用失败',
      message: '登录状态检查完成，但get_feed_detail调用失败。可能需要帖子URL而不是用户主页URL',
      debug: {
        session_initialized: mcpSessionInitialized,
        available_tools: availableTools.map(t => ({ name: t.name, description: t.description })),
        tried_tools: ['check_login_status', 'get_feed_detail'],
        url: url,
        note: 'get_feed_detail可能需要具体的帖子URL，请尝试输入小红书帖子链接而不是用户主页'
      }
    }, { status: 503 })

  } catch (error) {
    console.error('❌ API错误:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}