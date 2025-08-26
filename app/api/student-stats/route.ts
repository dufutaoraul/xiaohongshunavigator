import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const student_id = searchParams.get('student_id')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    console.log('📊 学员统计API请求:', { action, student_id, limit })
    
    switch (action) {
      case 'top_students':
        // 获取点赞最多的学员
        const { data: topStudents, error: topError } = await supabase
          .from('student_post_stats')
          .select('*')
          .order('total_likes', { ascending: false })
          .limit(limit)
        
        if (topError) throw topError
        
        return NextResponse.json({
          success: true,
          data: topStudents,
          message: `获取前${limit}名优秀学员成功`
        })
      
      case 'hot_posts':
        // 获取热门帖子
        const { data: hotPosts, error: hotError } = await supabase
          .from('hot_posts')
          .select('*')
          .limit(limit)
        
        if (hotError) throw hotError
        
        return NextResponse.json({
          success: true,
          data: hotPosts,
          message: `获取${limit}个热门帖子成功`
        })
      
      case 'recent_posts':
        // 获取最新帖子
        const { data: recentPosts, error: recentError } = await supabase
          .from('student_posts')
          .select('*')
          .order('publish_time', { ascending: false })
          .limit(limit)
        
        if (recentError) throw recentError
        
        return NextResponse.json({
          success: true,
          data: recentPosts,
          message: `获取${limit}个最新帖子成功`
        })
      
      case 'student_best':
        // 获取每个学员的最佳帖子
        const { data: bestPosts, error: bestError } = await supabase
          .from('student_best_posts')
          .select('*')
          .limit(limit)
        
        if (bestError) throw bestError
        
        return NextResponse.json({
          success: true,
          data: bestPosts,
          message: `获取${limit}个学员最佳帖子成功`
        })
      
      case 'student_posts':
        // 获取特定学员的所有帖子
        if (!student_id) {
          return NextResponse.json(
            { error: '缺少学员ID参数' },
            { status: 400 }
          )
        }
        
        const { data: studentPosts, error: studentError } = await supabase
          .from('student_posts')
          .select('*')
          .eq('student_id', student_id)
          .order('publish_time', { ascending: false })
          .limit(limit)
        
        if (studentError) throw studentError
        
        return NextResponse.json({
          success: true,
          data: studentPosts,
          message: `获取学员${student_id}的${studentPosts.length}个帖子成功`
        })
      
      case 'student_stats':
        // 获取特定学员的统计数据
        if (!student_id) {
          return NextResponse.json(
            { error: '缺少学员ID参数' },
            { status: 400 }
          )
        }
        
        const { data: stats, error: statsError } = await supabase
          .from('student_post_stats')
          .select('*')
          .eq('student_id', student_id)
          .single()
        
        if (statsError) throw statsError
        
        return NextResponse.json({
          success: true,
          data: stats,
          message: `获取学员${student_id}的统计数据成功`
        })
      
      case 'monthly_hot':
        // 获取近一个月的热门帖子
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
        
        const { data: monthlyHot, error: monthlyError } = await supabase
          .from('student_posts')
          .select('*')
          .gte('publish_time', oneMonthAgo.toISOString())
          .order('like_count', { ascending: false })
          .limit(limit)
        
        if (monthlyError) throw monthlyError
        
        return NextResponse.json({
          success: true,
          data: monthlyHot,
          message: `获取近一个月${limit}个热门帖子成功`
        })
      
      default:
        return NextResponse.json(
          { error: '不支持的查询类型' },
          { status: 400 }
        )
    }
    
  } catch (error: any) {
    console.error('学员统计API错误:', error)
    return NextResponse.json(
      { error: '查询失败', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, student_id, post_url } = body
    
    if (action === 'crawl_and_save') {
      // 爬取并保存帖子数据
      const crawlResponse = await fetch(`${request.nextUrl.origin}/api/crawler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'crawl_post',
          student_id,
          post_url
        })
      })
      
      const crawlResult = await crawlResponse.json()
      
      if (!crawlResult.success) {
        throw new Error(crawlResult.error)
      }
      
      return NextResponse.json({
        success: true,
        data: crawlResult.data,
        message: '帖子爬取并保存成功'
      })
    }
    
    return NextResponse.json(
      { error: '不支持的操作类型' },
      { status: 400 }
    )
    
  } catch (error: any) {
    console.error('学员统计POST API错误:', error)
    return NextResponse.json(
      { error: '操作失败', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
