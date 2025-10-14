import { NextRequest, NextResponse } from 'next/server'

// 由于MCP协议在HTTP环境下的状态管理复杂性，
// 建议直接使用Cursor的MCP集成来调用xiaohongshu-mcp工具
// 这里返回错误提示用户使用正确的方式

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: '请使用Cursor的MCP集成功能来调用xiaohongshu-mcp工具',
      suggestion: '在Cursor中直接说："帮我发布这个帖子到小红书"，系统会自动调用publish_content工具'
    },
    { status: 400 }
  )
}