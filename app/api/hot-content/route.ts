import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 模拟热门内容数据
    // 在实际应用中，这里应该从数据库或外部API获取真实的热门内容
    const hotContent = [
      {
        note_id: 'hot001',
        title: '小红书爆款文案写作技巧分享！新手必看的10个套路',
        author: '文案小达人',
        liked_count: 12580,
        comment_count: 456,
        url: 'https://www.xiaohongshu.com/explore/hot001',
        cover_image: '',
        tags: ['文案写作', '小红书运营', '新手教程', '爆款技巧']
      },
      {
        note_id: 'hot002',
        title: 'AI工具让我的工作效率提升300%！这些神器你必须知道',
        author: 'AI探索者',
        liked_count: 8920,
        comment_count: 234,
        url: 'https://www.xiaohongshu.com/explore/hot002',
        cover_image: '',
        tags: ['AI工具', '效率提升', '职场技能', '生产力']
      },
      {
        note_id: 'hot003',
        title: '90天学会小红书运营，从0到10万粉丝的完整攻略',
        author: '运营大神',
        liked_count: 15600,
        comment_count: 789,
        url: 'https://www.xiaohongshu.com/explore/hot003',
        cover_image: '',
        tags: ['小红书运营', '涨粉技巧', '内容创作', '社媒营销']
      },
      {
        note_id: 'hot004',
        title: 'ChatGPT提示词大全！让AI成为你的最佳助手',
        author: 'Prompt工程师',
        liked_count: 9876,
        comment_count: 345,
        url: 'https://www.xiaohongshu.com/explore/hot004',
        cover_image: '',
        tags: ['ChatGPT', '提示词', 'AI应用', '工作效率']
      },
      {
        note_id: 'hot005',
        title: '副业月入过万！这些技能让你在家就能赚钱',
        author: '副业达人',
        liked_count: 18900,
        comment_count: 567,
        url: 'https://www.xiaohongshu.com/explore/hot005',
        cover_image: '',
        tags: ['副业', '在家赚钱', '技能变现', '财务自由']
      },
      {
        note_id: 'hot006',
        title: '学会这些思维导图技巧，让你的学习效率翻倍',
        author: '学习方法论',
        liked_count: 7654,
        comment_count: 198,
        url: 'https://www.xiaohongshu.com/explore/hot006',
        cover_image: '',
        tags: ['思维导图', '学习方法', '效率提升', '知识管理']
      },
      {
        note_id: 'hot007',
        title: '个人品牌打造指南：如何在互联网时代脱颖而出',
        author: '品牌策略师',
        liked_count: 11234,
        comment_count: 423,
        url: 'https://www.xiaohongshu.com/explore/hot007',
        cover_image: '',
        tags: ['个人品牌', '自媒体', '影响力', '职业发展']
      },
      {
        note_id: 'hot008',
        title: '数字化转型时代，这些技能让你不被淘汰',
        author: '未来职场',
        liked_count: 6789,
        comment_count: 156,
        url: 'https://www.xiaohongshu.com/explore/hot008',
        cover_image: '',
        tags: ['数字化', '职场技能', '未来趋势', '技能提升']
      }
    ]

    // 随机选择5-6个热门内容进行轮播
    const shuffled = hotContent.sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, 6)

    return NextResponse.json({
      success: true,
      data: selected,
      message: '获取热门内容成功',
      total: selected.length
    })

  } catch (error: any) {
    console.error('获取热门内容失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取热门内容失败',
      details: error?.message
    }, { status: 500 })
  }
}

// POST 方法：刷新热门内容
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category = 'all', limit = 6 } = body

    // 这里可以根据分类获取不同的热门内容
    // 目前返回相同的模拟数据
    const response = await GET(request)
    return response

  } catch (error: any) {
    console.error('刷新热门内容失败:', error)
    return NextResponse.json({
      success: false,
      error: '刷新热门内容失败',
      details: error?.message
    }, { status: 500 })
  }
}
