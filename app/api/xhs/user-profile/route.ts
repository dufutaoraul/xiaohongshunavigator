import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, xsecToken } = await request.json()

    if (!userId || !xsecToken) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必需参数：userId 和 xsecToken',
          usage: {
            description: '获取小红书用户个人主页信息，包括用户基本信息和笔记内容',
            requiredParams: {
              userId: '用户ID，可以从搜索结果或Feed列表中获取',
              xsecToken: '安全令牌，可以从搜索结果或Feed列表中获取'
            },
            note: '需要先登录小红书才能使用此功能'
          }
        },
        { status: 400 }
      )
    }

    // 检查xiaohongshu-mcp服务状态
    const serviceCheck = await fetch('http://localhost:18060/api/v1/login/status', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })

    if (!serviceCheck.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'xiaohongshu-mcp服务不可用',
          suggestion: '请确保xiaohongshu-mcp服务正在运行在端口18060'
        },
        { status: 503 }
      )
    }

    const loginStatus = await serviceCheck.json()

    if (!loginStatus.success || !loginStatus.data?.is_logged_in) {
      return NextResponse.json(
        {
          success: false,
          error: '未登录小红书账号',
          suggestion: '请先运行登录工具登录小红书账号',
          loginStatus: loginStatus.data
        },
        { status: 401 }
      )
    }

    // 调用user_profile API
    const profileResponse = await fetch('http://localhost:18060/api/v1/user/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        xsec_token: xsecToken
      }),
      signal: AbortSignal.timeout(30000)
    })

    if (!profileResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `获取用户资料失败: HTTP ${profileResponse.status}`,
          details: await profileResponse.text()
        },
        { status: profileResponse.status }
      )
    }

    const profileData = await profileResponse.json()

    if (!profileData.success) {
      return NextResponse.json(
        {
          success: false,
          error: profileData.message || '获取用户资料失败',
          details: profileData
        },
        { status: 400 }
      )
    }

    // 解析用户数据和帖子数据
    const userData = profileData.data.user_info || {}
    const posts = profileData.data.notes || []

    // 格式化返回数据
    const result = {
      success: true,
      data: {
        userInfo: {
          userId: userData.user_id || userId,
          nickname: userData.nickname || userData.name || 'Unknown',
          description: userData.desc || userData.bio || '',
          avatar: userData.avatar || userData.avatarUrl,
          stats: {
            followers: userData.follows || userData.followerCount || 0,
            following: userData.fans || userData.followingCount || 0,
            likes: userData.interaction || userData.likeCount || 0,
            posts: posts.length
          }
        },
        posts: posts.map((post: any) => ({
          id: post.note_id || post.id,
          title: post.title || post.display_title || '',
          description: post.desc || post.content || '',
          type: post.type || 'normal',
          coverImage: post.cover?.url || post.cover,
          images: post.images_list || post.images || [],
          video: post.video,
          stats: {
            likes: parseInt(post.interact_info?.liked_count || post.likes || '0'),
            comments: parseInt(post.interact_info?.comment_count || post.comments || '0'),
            collections: parseInt(post.interact_info?.collected_count || post.collections || '0'),
            shares: parseInt(post.interact_info?.share_count || post.shares || '0')
          },
          publishTime: post.time ? new Date(post.time * 1000) : new Date(),
          url: post.share_info?.un_share_url || `https://www.xiaohongshu.com/explore/${post.note_id || post.id}`
        }))
      },
      message: `成功获取用户 ${userData.nickname || userId} 的资料和 ${posts.length} 个帖子`
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('获取用户资料失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}