import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json()

    if (!keyword) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少关键词参数',
          usage: {
            description: '根据关键词搜索小红书内容',
            requiredParams: {
              keyword: '搜索关键词，例如："美食"、"旅行"等'
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

    // 调用search_feeds API
    const searchResponse = await fetch('http://localhost:18060/api/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        keyword: keyword,
        page: 1,
        page_size: 20
      }),
      signal: AbortSignal.timeout(30000)
    })

    if (!searchResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `搜索失败: HTTP ${searchResponse.status}`,
          details: await searchResponse.text()
        },
        { status: searchResponse.status }
      )
    }

    const searchData = await searchResponse.json()

    if (!searchData.success) {
      return NextResponse.json(
        {
          success: false,
          error: searchData.message || '搜索失败',
          details: searchData
        },
        { status: 400 }
      )
    }

    // 解析搜索结果
    const posts = searchData.data?.notes || searchData.data?.feeds || []

    // 格式化返回数据
    const result = {
      success: true,
      data: {
        keyword: keyword,
        total: posts.length,
        posts: posts.map((post: any) => ({
          id: post.note_id || post.id,
          title: post.title || post.display_title || '',
          description: post.desc || post.content || '',
          type: post.type || 'normal',
          coverImage: post.cover?.url || post.cover,
          images: post.images_list || post.images || [],
          video: post.video,
          author: {
            userId: post.user?.user_id || post.author_id,
            nickname: post.user?.nickname || post.author_name || 'Unknown',
            avatar: post.user?.avatar || post.author_avatar
          },
          stats: {
            likes: parseInt(post.interact_info?.liked_count || post.likes || '0'),
            comments: parseInt(post.interact_info?.comment_count || post.comments || '0'),
            collections: parseInt(post.interact_info?.collected_count || post.collections || '0'),
            shares: parseInt(post.interact_info?.share_count || post.shares || '0')
          },
          publishTime: post.time ? new Date(post.time * 1000) : new Date(),
          url: post.share_info?.un_share_url || `https://www.xiaohongshu.com/explore/${post.note_id || post.id}`,
          // 这些是调用user_profile时需要的参数
          userIdForProfile: post.user?.user_id || post.author_id,
          xsecToken: post.xsec_token
        }))
      },
      message: `搜索 "${keyword}" 找到 ${posts.length} 个结果`
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('搜索失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}