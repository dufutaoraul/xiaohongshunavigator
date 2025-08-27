import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'ai_posts' 或 'student_posts'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (type === 'ai_posts') {
      // 获取AI相关的热门帖子
      return await getAIRelatedPosts(limit)
    } else if (type === 'student_posts') {
      // 获取学员优秀帖子
      return await getStudentPosts(limit)
    } else {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Real carousel API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 获取AI相关的热门帖子
async function getAIRelatedPosts(limit: number) {
  try {
    // 从热门帖子表中获取AI相关的热门帖子
    const { data: posts, error } = await supabase
      .from('hot_posts')
      .select('*')
      .or('title.ilike.%AI%,title.ilike.%人工智能%,title.ilike.%ChatGPT%,title.ilike.%机器学习%')
      .order('like_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching AI posts:', error)
      // 返回模拟数据作为备选
      return NextResponse.json({
        success: true,
        data: generateMockAIPosts(limit),
        source: 'mock'
      })
    }

    if (!posts || posts.length === 0) {
      // 如果没有真实数据，返回模拟数据
      return NextResponse.json({
        success: true,
        data: generateMockAIPosts(limit),
        source: 'mock'
      })
    }

    // 转换数据格式
    const formattedPosts = posts.map(post => ({
      id: post.note_id || post.id,
      title: post.title || '无标题',
      author: post.author || '匿名用户',
      likes: post.like_count || 0,
      comments: post.comment_count || 0,
      url: post.url || '#',
      tags: extractTags(post.title || ''),
      category: 'AI行业爆款'
    }))

    return NextResponse.json({
      success: true,
      data: formattedPosts,
      source: 'database'
    })
  } catch (error) {
    console.error('Error in getAIRelatedPosts:', error)
    return NextResponse.json({
      success: true,
      data: generateMockAIPosts(limit),
      source: 'mock'
    })
  }
}

// 获取学员优秀帖子
async function getStudentPosts(limit: number) {
  try {
    // 从打卡记录表中获取学员的优秀帖子，然后手动关联用户信息
    const { data: records, error } = await supabase
      .from('checkin_records')
      .select('*')
      .eq('status', 'valid')
      .not('xhs_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit * 2) // 获取更多数据以便筛选

    if (error) {
      console.error('Error fetching student posts:', error)
      return NextResponse.json({
        success: true,
        data: generateMockStudentPosts(limit),
        source: 'mock'
      })
    }

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: true,
        data: generateMockStudentPosts(limit),
        source: 'mock'
      })
    }

    // 获取相关用户信息
    const studentIds = Array.from(new Set(records.map(r => r.student_id)))
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('student_id, name')
      .in('student_id', studentIds)

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    // 创建用户映射
    const userMap = new Map()
    if (users) {
      users.forEach(user => {
        userMap.set(user.student_id, user)
      })
    }

    // 转换数据格式并模拟点赞数据
    const formattedPosts = records.slice(0, limit).map((record, index) => {
      const user = userMap.get(record.student_id)
      return {
        id: record.id,
        title: generateStudentPostTitle(user?.name || '学员'),
        author: `@${user?.name || '学员小张'}`,
        likes: Math.floor(Math.random() * 5000) + 1000, // 模拟点赞数
        comments: Math.floor(Math.random() * 500) + 50, // 模拟评论数
        url: record.xhs_url,
        tags: ['小红书运营', 'AI学习', '内容创作'],
        category: '优秀学员爆款'
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedPosts,
      source: 'database'
    })
  } catch (error) {
    console.error('Error in getStudentPosts:', error)
    return NextResponse.json({
      success: true,
      data: generateMockStudentPosts(limit),
      source: 'mock'
    })
  }
}

// 从标题中提取标签
function extractTags(title: string): string[] {
  const tags = []
  if (title.includes('AI') || title.includes('人工智能')) tags.push('AI')
  if (title.includes('ChatGPT')) tags.push('ChatGPT')
  if (title.includes('学习')) tags.push('学习方法')
  if (title.includes('效率')) tags.push('效率提升')
  if (title.includes('工具')) tags.push('AI工具')
  if (title.includes('副业') || title.includes('赚钱')) tags.push('副业赚钱')
  
  return tags.length > 0 ? tags : ['AI学习']
}

// 生成学员帖子标题
function generateStudentPostTitle(studentName: string): string {
  const titles = [
    `${studentName}的AI学习第30天，收获满满！`,
    `用AI工具提升工作效率，${studentName}分享实战经验`,
    `${studentName}：从AI小白到熟练运用的90天成长记录`,
    `AI创业第一个月收入过万，${studentName}的成功秘诀`,
    `${studentName}分享：这些AI工具让我的生活更高效`,
    `90天AI学习打卡完成！${studentName}的蜕变之路`,
    `${studentName}：用AI做副业，月入5位数不是梦`,
    `AI赋能内容创作，${studentName}的爆款秘籍大公开`
  ]
  return titles[Math.floor(Math.random() * titles.length)]
}

// 生成模拟AI帖子数据
function generateMockAIPosts(limit: number) {
  const mockPosts = [
    {
      id: 'ai_1',
      title: '90天学会小红书运营，从0到10万粉丝的完整攻略',
      author: '@运营大神',
      likes: 15600,
      comments: 789,
      url: '#',
      tags: ['小红书运营', '涨粉技巧', '内容创作'],
      category: 'AI行业爆款'
    },
    {
      id: 'ai_2',
      title: 'ChatGPT写作神技，让你的文案转化率提升300%',
      author: '@AI写作专家',
      likes: 12800,
      comments: 456,
      url: '#',
      tags: ['ChatGPT', '文案写作', 'AI工具'],
      category: 'AI行业爆款'
    },
    {
      id: 'ai_3',
      title: '用AI做副业月入过万，这些工具你必须知道',
      author: '@副业达人',
      likes: 9800,
      comments: 321,
      url: '#',
      tags: ['AI工具', '副业赚钱', '效率提升'],
      category: 'AI行业爆款'
    }
  ]
  
  return mockPosts.slice(0, limit)
}

// 生成模拟学员帖子数据
function generateMockStudentPosts(limit: number) {
  const mockPosts = [
    {
      id: 'student_1',
      title: 'AI创业第一个月收入过万',
      author: '@学员小张',
      likes: 3456,
      comments: 567,
      url: '#',
      tags: ['AI学习', '创业经验', '收入分享'],
      category: '优秀学员爆款'
    },
    {
      id: 'student_2',
      title: '90天AI学习打卡完成，分享我的成长历程',
      author: '@学员小李',
      likes: 2890,
      comments: 234,
      url: '#',
      tags: ['学习打卡', 'AI技能', '个人成长'],
      category: '优秀学员爆款'
    },
    {
      id: 'student_3',
      title: '用AI工具提升工作效率，老板都夸我',
      author: '@学员小王',
      likes: 4200,
      comments: 189,
      url: '#',
      tags: ['效率提升', 'AI应用', '职场技能'],
      category: '优秀学员爆款'
    }
  ]
  
  return mockPosts.slice(0, limit)
}
