// 最简单的小红书抓取API
// 输入：小红书用户主页链接
// 输出：该用户排名前三的帖子链接

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userUrl } = await request.json()
    
    if (!userUrl) {
      return NextResponse.json({
        success: false,
        error: '请提供小红书用户主页链接'
      }, { status: 400 })
    }

    console.log('🔍 开始抓取用户:', userUrl)

    // 步骤1: 测试MCP服务连接
    const healthResponse = await fetch('http://localhost:18060/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })

    if (!healthResponse.ok) {
      throw new Error(`MCP服务连接失败: HTTP ${healthResponse.status}`)
    }

    console.log('✅ MCP服务连接正常')

    // 步骤2: 通过MCP协议获取用户帖子数据
    const mcpResponse = await fetch('http://localhost:18060/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'get_user_posts',
        params: {
          user_url: userUrl,
          limit: 10
        },
        id: 1
      }),
      signal: AbortSignal.timeout(30000)
    })

    if (!mcpResponse.ok) {
      throw new Error(`MCP协议调用失败: HTTP ${mcpResponse.status}`)
    }

    const mcpData = await mcpResponse.json()
    console.log('📦 MCP响应:', JSON.stringify(mcpData, null, 2))

    // 步骤3: 处理响应数据
    if (mcpData.error) {
      throw new Error(`MCP错误: ${mcpData.error.message || mcpData.error}`)
    }

    const posts = mcpData.result?.posts || []
    
    if (posts.length === 0) {
      return NextResponse.json({
        success: false,
        error: '未找到该用户的帖子数据，可能需要先登录小红书账号'
      })
    }

    // 步骤4: 按互动数据排序，获取前三名
    const sortedPosts = posts
      .filter((post: any) => post.url && post.title)
      .map((post: any) => ({
        title: post.title,
        url: post.url,
        likes: parseInt(post.likes || 0),
        comments: parseInt(post.comments || 0),
        collections: parseInt(post.collections || 0),
        hotScore: (parseInt(post.likes || 0) * 1) + 
                 (parseInt(post.comments || 0) * 3) + 
                 (parseInt(post.collections || 0) * 5)
      }))
      .sort((a, b) => b.hotScore - a.hotScore)
      .slice(0, 3)

    console.log('🏆 排名前三的帖子:', sortedPosts)

    return NextResponse.json({
      success: true,
      data: {
        userUrl,
        totalPosts: posts.length,
        topPosts: sortedPosts,
        message: `成功抓取到 ${posts.length} 个帖子，以下是热度排名前三的帖子`
      }
    })

  } catch (error: any) {
    console.error('❌ 抓取失败:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || '抓取失败',
      details: {
        message: '请确保：',
        steps: [
          '1. MCP Docker服务正在运行',
          '2. 已登录小红书账号',
          '3. 提供的链接格式正确',
          '4. 网络连接正常'
        ]
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    name: '简单小红书抓取测试',
    description: '输入小红书用户主页链接，返回该用户热度排名前三的帖子',
    usage: {
      method: 'POST',
      body: {
        userUrl: 'https://www.xiaohongshu.com/user/profile/用户ID'
      }
    },
    example: {
      userUrl: 'https://www.xiaohongshu.com/user/profile/5ff0e4ac000000000100d1b4'
    }
  })
}
