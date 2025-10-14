// 学员主页热门帖子排名 API
// 最小化测试版本 - 只测试少量账号避免过度抓取

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      student_profiles = [], // 学员小红书主页链接数组
      limit = 10,
      test_mode = true // 测试模式，限制抓取数量
    } = body

    console.log('📊 学员主页热门帖子分析请求:', {
      profiles_count: student_profiles.length,
      limit,
      test_mode
    })

    if (!student_profiles || student_profiles.length === 0) {
      return NextResponse.json({
        success: false,
        error: '请提供至少一个学员主页链接进行测试'
      }, { status: 400 })
    }

    // 测试模式限制
    if (test_mode && student_profiles.length > 3) {
      return NextResponse.json({
        success: false,
        error: '测试模式下最多只能分析3个学员主页，避免过度抓取'
      }, { status: 400 })
    }

    const results = []

    for (const profile of student_profiles.slice(0, test_mode ? 3 : 10)) {
      try {
        console.log(`🔍 正在分析学员主页: ${profile.name || '未知'} (${profile.url})`)

        // 尝试通过MCP服务获取用户主页数据
        const mcpResponse = await fetch(`http://localhost:18060/user-profile?url=${encodeURIComponent(profile.url)}&limit=20`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'XiaohongshuNavigator/1.0'
          },
          signal: AbortSignal.timeout(10000)
        })

        if (mcpResponse.ok) {
          const userData = await mcpResponse.json()

          if (userData && userData.posts && userData.posts.length > 0) {
            console.log(`✅ 获取到${userData.posts.length}个帖子，正在计算热门排名...`)

            // 计算热门度分数
            const rankedPosts = calculatePopularityScores(userData.posts)
            const topPosts = rankedPosts.slice(0, limit)

            results.push({
              student: {
                name: profile.name,
                url: profile.url,
                profile_info: userData.profile || {}
              },
              posts: topPosts,
              total_posts: userData.posts.length,
              source: 'mcp'
            })
            continue
          }
        }

        console.log(`⚠️ MCP获取失败，为 ${profile.name} 生成模拟数据`)

        // MCP失败时生成测试数据
        const mockPosts = generateMockStudentPosts(profile.name, 15)
        const rankedPosts = calculatePopularityScores(mockPosts)
        const topPosts = rankedPosts.slice(0, limit)

        results.push({
          student: {
            name: profile.name,
            url: profile.url,
            profile_info: {
              nickname: profile.name,
              followers: 1000 + Math.floor(Math.random() * 5000)
            }
          },
          posts: topPosts,
          total_posts: mockPosts.length,
          source: 'mock'
        })

      } catch (error: any) {
        console.error(`❌ 处理学员 ${profile.name} 时出错:`, error?.message || '未知错误')

        results.push({
          student: {
            name: profile.name,
            url: profile.url,
            error: error?.message || '未知错误'
          },
          posts: [],
          total_posts: 0,
          source: 'error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis_time: new Date().toISOString(),
        test_mode,
        students_analyzed: results.length,
        results: results
      },
      message: `成功分析了 ${results.length} 个学员的主页热门帖子`
    })

  } catch (error: any) {
    console.error('学员主页分析API错误:', error)
    return NextResponse.json({
      success: false,
      error: '分析失败，请稍后重试',
      details: error?.message || '未知错误'
    }, { status: 500 })
  }
}

// 计算热门度分数的算法
function calculatePopularityScores(posts: any[]) {
  return posts.map(post => {
    // 热门度算法：综合考虑点赞、评论、收藏、分享
    const likes = post.stats?.likes || 0
    const comments = post.stats?.comments || 0
    const collections = post.stats?.collections || 0
    const shares = post.stats?.shares || 0

    // 权重配置
    const likesWeight = 0.4
    const commentsWeight = 0.3
    const collectionsWeight = 0.2
    const sharesWeight = 0.1

    const popularityScore =
      (likes * likesWeight) +
      (comments * commentsWeight) +
      (collections * collectionsWeight) +
      (shares * sharesWeight)

    return {
      ...post,
      popularity_score: Math.round(popularityScore),
      engagement_rate: Math.round(((comments + shares) / Math.max(likes, 1)) * 100) // 参与度
    }
  }).sort((a, b) => b.popularity_score - a.popularity_score)
}

// 生成模拟学员帖子数据（测试用）
function generateMockStudentPosts(studentName: string, count: number) {
  const posts = []
  const topics = ['AI学习心得', 'ChatGPT使用技巧', '效率工具分享', '学习方法总结', '项目实战经验']

  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length]
    const daysAgo = Math.floor(Math.random() * 30) + 1

    posts.push({
      id: `${studentName}_post_${i}`,
      title: `${topic} - ${studentName}的第${i+1}期分享`,
      description: `${studentName}分享关于${topic}的实用经验和心得...`,
      author: {
        userId: `user_${studentName}`,
        nickname: studentName,
        avatar: `https://picsum.photos/100/100?random=${studentName}`
      },
      stats: {
        likes: Math.floor(Math.random() * 2000) + 100, // 100-2100
        comments: Math.floor(Math.random() * 200) + 10, // 10-210
        shares: Math.floor(Math.random() * 100) + 5,    // 5-105
        collections: Math.floor(Math.random() * 300) + 20 // 20-320
      },
      publishTime: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://www.xiaohongshu.com/explore/mock_${studentName}_${i}`,
    })
  }

  return posts
}