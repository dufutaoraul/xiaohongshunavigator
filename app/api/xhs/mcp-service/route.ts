// MCP服务管理API
// 提供服务状态检查、启动、停止等功能

import { NextRequest, NextResponse } from 'next/server'
import { mcpServiceManager } from '@/lib/xhs-integration/mcp-service-manager'

// GET: 获取MCP服务状态
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    switch (action) {
      case 'status':
        const status = await mcpServiceManager.getServiceStatus()
        return NextResponse.json({
          success: true,
          data: status,
          message: status.isRunning ? 'MCP服务运行正常' : 'MCP服务未运行'
        })

      case 'health':
        const healthStatus = await mcpServiceManager.getServiceStatus()
        const mcpTest = await mcpServiceManager.testMCPConnection()
        const loginCheck = await mcpServiceManager.checkLoginStatus()

        return NextResponse.json({
          success: true,
          data: {
            service: healthStatus,
            mcp_protocol: mcpTest,
            login: loginCheck,
            overall_health: healthStatus.isRunning && mcpTest.success && loginCheck.isLoggedIn
          },
          message: '健康检查完成'
        })

      case 'logs':
        const lines = parseInt(searchParams.get('lines') || '50')
        const logs = await mcpServiceManager.getServiceLogs(lines)
        return NextResponse.json({
          success: true,
          data: { logs },
          message: `获取最近 ${logs.length} 条日志`
        })

      default:
        return NextResponse.json({
          success: false,
          error: '无效的action参数，支持: status, health, logs'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('MCP服务状态检查失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '状态检查失败'
    }, { status: 500 })
  }
}

// POST: 控制MCP服务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'start':
        console.log('🚀 启动MCP服务...')
        const startResult = await mcpServiceManager.startService()
        
        return NextResponse.json({
          success: startResult.success,
          message: startResult.message,
          data: startResult.success ? await mcpServiceManager.getServiceStatus() : null
        }, { status: startResult.success ? 200 : 500 })

      case 'stop':
        console.log('⏹️ 停止MCP服务...')
        const stopResult = await mcpServiceManager.stopService()
        
        return NextResponse.json({
          success: stopResult.success,
          message: stopResult.message
        }, { status: stopResult.success ? 200 : 500 })

      case 'restart':
        console.log('🔄 重启MCP服务...')
        const restartResult = await mcpServiceManager.restartService()
        
        return NextResponse.json({
          success: restartResult.success,
          message: restartResult.message,
          data: restartResult.success ? await mcpServiceManager.getServiceStatus() : null
        }, { status: restartResult.success ? 200 : 500 })

      case 'test_connection':
        console.log('🔍 测试MCP连接...')
        const testResult = await mcpServiceManager.testMCPConnection()
        
        return NextResponse.json({
          success: testResult.success,
          message: testResult.message
        })

      case 'check_login':
        console.log('🔐 检查登录状态...')
        const loginResult = await mcpServiceManager.checkLoginStatus()
        
        return NextResponse.json({
          success: true,
          data: loginResult,
          message: loginResult.message
        })

      default:
        return NextResponse.json({
          success: false,
          error: '无效的action参数，支持: start, stop, restart, test_connection, check_login'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('MCP服务控制失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务控制失败'
    }, { status: 500 })
  }
}

// PUT: 更新MCP服务配置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { config } = body

    // 这里可以添加配置更新逻辑
    // 目前返回成功响应
    return NextResponse.json({
      success: true,
      message: '配置更新功能开发中',
      data: config
    })

  } catch (error) {
    console.error('MCP服务配置更新失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '配置更新失败'
    }, { status: 500 })
  }
}
