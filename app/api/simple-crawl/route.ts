// 最简单的小红书抓取API
// 输入：小红书用户主页链接
// 输出：该用户排名前三的帖子链接

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userUrl, cookies } = await request.json()

    if (!userUrl) {
      return NextResponse.json({
        success: false,
        error: '请提供小红书用户主页链接'
      }, { status: 400 })
    }

    console.log('🔍 开始抓取用户:', userUrl)
    console.log('🍪 是否提供cookies:', !!cookies)

    // 步骤1: 测试MCP服务连接
    const healthResponse = await fetch('http://localhost:18060/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })

    if (!healthResponse.ok) {
      throw new Error(`MCP服务连接失败: HTTP ${healthResponse.status}`)
    }

    console.log('✅ MCP服务连接正常')

    // 步骤2: 通过MCP协议获取用户个人主页信息
    // 首先从URL中提取用户ID
    const userIdMatch = userUrl.match(/user\/profile\/([^?]+)/)
    if (!userIdMatch) {
      throw new Error('无法从URL中提取用户ID，请确保URL格式正确')
    }

    const userId = userIdMatch[1]
    console.log('📝 提取到用户ID:', userId)

    const mcpResponse = await fetch('http://localhost:18060/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'user_profile',
          arguments: {
            user_id: userId,
            xsec_token: '',  // 先尝试空token，如果失败会提示需要token
            ...(cookies && { cookies: cookies })
          }
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

    console.log('📦 完整MCP响应结构:', JSON.stringify(mcpData, null, 2))

    // 尝试多种可能的数据结构
    let userProfile = null
    let profileData = null

    // 方式1: 检查 result.content[0].text
    if (mcpData.result?.content?.[0]?.text) {
      userProfile = mcpData.result.content[0].text
      console.log('📄 找到用户资料文本:', userProfile.substring(0, 200) + '...')
    }
    // 方式2: 检查 result 直接包含数据
    else if (mcpData.result && typeof mcpData.result === 'object') {
      profileData = mcpData.result
      console.log('📊 直接使用result数据')
    }
    // 方式3: 检查其他可能的结构
    else {
      console.log('❓ 未知的响应结构，尝试解析...')
      return NextResponse.json({
        success: false,
        error: '未找到该用户的数据，可能需要先登录小红书账号',
        debug: {
          hasResult: !!mcpData.result,
          resultType: typeof mcpData.result,
          resultKeys: mcpData.result ? Object.keys(mcpData.result) : [],
          fullResponse: mcpData
        }
      })
    }

    // 解析用户资料数据
    if (userProfile && !profileData) {
      try {
        profileData = JSON.parse(userProfile)
        console.log('✅ 成功解析用户资料JSON')
      } catch (e) {
        console.log('❌ JSON解析失败，尝试其他方式:', e)
        // 如果不是JSON，可能是纯文本描述
        return NextResponse.json({
          success: false,
          error: '用户资料数据格式异常，可能需要登录或提供xsec_token',
          debug: {
            rawData: userProfile.substring(0, 500),
            parseError: e instanceof Error ? e.message : '未知错误'
          }
        })
      }
    }

    // 检查数据结构并提取帖子信息
    let notes = []
    let userInfo = {}

    if (profileData) {
      // 尝试多种可能的数据结构
      notes = profileData.notes || profileData.posts || profileData.data || []
      userInfo = profileData.basic_info || profileData.user_info || profileData.info || {}

      console.log('📊 数据结构分析:')
      console.log('- 帖子数量:', notes.length)
      console.log('- 用户信息键:', Object.keys(userInfo))
      console.log('- 完整数据键:', Object.keys(profileData))
    }

    if (notes.length === 0) {
      return NextResponse.json({
        success: false,
        error: '该用户暂无公开帖子或需要登录查看',
        debug: {
          profileDataKeys: profileData ? Object.keys(profileData) : [],
          hasNotes: !!profileData?.notes,
          hasPosts: !!profileData?.posts,
          hasData: !!profileData?.data
        }
      })
    }

    // 步骤4: 按互动数据排序，获取前三名
    const sortedPosts = notes
      .filter((note: any) => {
        // 支持多种数据结构
        return note && (note.note_card || note.interact_info || note.stats)
      })
      .map((note: any) => {
        // 适配不同的数据结构
        let title = '无标题'
        let likes = 0
        let comments = 0
        let collections = 0
        let noteId = note.id || note.note_id || ''

        if (note.note_card) {
          // 结构1: note_card格式
          const card = note.note_card
          const interactInfo = card.interact_info || {}
          title = card.display_title || card.title || '无标题'
          likes = parseInt(interactInfo.liked_count || 0)
          comments = parseInt(interactInfo.comment_count || 0)
          collections = parseInt(interactInfo.collected_count || 0)
        } else if (note.interact_info) {
          // 结构2: 直接interact_info格式
          title = note.title || note.display_title || '无标题'
          likes = parseInt(note.interact_info.liked_count || 0)
          comments = parseInt(note.interact_info.comment_count || 0)
          collections = parseInt(note.interact_info.collected_count || 0)
        } else if (note.stats) {
          // 结构3: stats格式
          title = note.title || '无标题'
          likes = parseInt(note.stats.likes || 0)
          comments = parseInt(note.stats.comments || 0)
          collections = parseInt(note.stats.collections || 0)
        }

        return {
          title,
          url: `https://www.xiaohongshu.com/explore/${noteId}`,
          likes,
          comments,
          collections,
          hotScore: (likes * 1) + (comments * 3) + (collections * 5)
        }
      })
      .sort((a, b) => b.hotScore - a.hotScore)
      .slice(0, 3)

    console.log('🏆 排名前三的帖子:', sortedPosts)

    return NextResponse.json({
      success: true,
      data: {
        userUrl,
        userId,
        userInfo: {
          nickname: userInfo.nickname || userInfo.name || '未知用户',
          desc: userInfo.desc || userInfo.description || userInfo.bio || '暂无简介',
          follows: userInfo.follows || userInfo.following || 0,
          fans: userInfo.fans || userInfo.followers || 0,
          interaction: userInfo.interaction || userInfo.likes || 0
        },
        totalPosts: notes.length,
        topPosts: sortedPosts,
        message: `成功抓取到用户 ${userInfo.nickname || userInfo.name || '未知用户'} 的 ${notes.length} 个帖子，以下是热度排名前三的帖子`,
        debug: {
          mcpResponseStructure: Object.keys(mcpData),
          profileDataStructure: profileData ? Object.keys(profileData) : [],
          userInfoStructure: Object.keys(userInfo),
          notesStructure: notes.length > 0 ? Object.keys(notes[0]) : []
        }
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
