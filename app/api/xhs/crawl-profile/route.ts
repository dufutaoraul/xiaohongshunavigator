import { NextRequest, NextResponse } from 'next/server'
import { mcpServiceManager } from '@/lib/xhs-integration/mcp-service-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, require_real_data } = body

    console.log(`🎯 开始抓取学员 ${student_id} 的真实数据...`)

    // 检查MCP服务状态
    const status = await mcpServiceManager.getServiceStatus()
    if (!status.isRunning || !status.isHealthy) {
      return NextResponse.json({
        success: false,
        error: 'MCP服务未运行或不健康',
        message: '请先启动MCP服务并确保服务健康'
      }, { status: 503 })
    }

    // 检查登录状态
    const loginStatus = await mcpServiceManager.checkLoginStatus()
    if (!loginStatus.isLoggedIn) {
      return NextResponse.json({
        success: false,
        error: '未登录小红书账号',
        message: '请先登录小红书账号后再进行数据抓取'
      }, { status: 401 })
    }

    // 如果明确要求真实数据但MCP不可用，返回错误而不是虚拟数据
    if (require_real_data) {
      try {
        // 这里应该调用真实的MCP API进行数据抓取
        // 暂时返回服务不可用错误，因为真实的MCP抓取功能需要进一步实现
        const mcpResult = await callRealMCPService(student_id)

        return NextResponse.json({
          success: true,
          data: mcpResult,
          message: '成功抓取真实数据'
        })
      } catch (error) {
        console.error('真实数据抓取失败:', error)
        return NextResponse.json({
          success: false,
          error: '真实数据抓取失败',
          message: `无法获取学员 ${student_id} 的真实数据，MCP服务调用失败`
        }, { status: 503 })
      }
    }

    // 如果没有要求真实数据，也返回错误（根据用户要求，绝不返回虚拟数据）
    return NextResponse.json({
      success: false,
      error: '仅支持真实数据抓取',
      message: '本系统不提供虚拟数据，请确保MCP服务正常运行后重试'
    }, { status: 400 })

  } catch (error) {
    console.error('抓取API错误:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 真实的MCP服务调用函数
async function callRealMCPService(student_id: string) {
  // 这里需要实现真实的MCP调用逻辑
  // 暂时抛出错误，提示需要实现
  throw new Error('MCP真实数据抓取功能正在开发中，请确保MCP服务正确配置和运行')
}