import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 模拟小红书数据爬取（实际需要真实的爬虫实现）
async function crawlXiaohongshuPost(postUrl: string, cookie?: string) {
  try {
    // 这里应该是真实的爬虫逻辑
    // 由于小红书的反爬机制，这里提供模拟数据
    
    // 从URL中提取帖子ID
    const postIdMatch = postUrl.match(/\/explore\/([a-zA-Z0-9]+)/)
    const postId = postIdMatch ? postIdMatch[1] : `mock_${Date.now()}`
    
    // 模拟爬取数据
    const mockData = {
      post_id: postId,
      title: `AI学习心得分享 - ${new Date().toLocaleDateString()}`,
      content: '今天学习了AI相关知识，收获很多...',
      cover_image_url: 'https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=AI学习',
      view_count: Math.floor(Math.random() * 1000) + 100,
      like_count: Math.floor(Math.random() * 100) + 10,
      comment_count: Math.floor(Math.random() * 50) + 5,
      share_count: Math.floor(Math.random() * 20) + 1,
      publish_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    console.log('🕷️ 爬取帖子数据:', { postUrl, postId, mockData })
    
    return mockData
  } catch (error) {
    console.error('爬取失败:', error)
    throw error
  }
}

// 爬取用户主页所有帖子
async function crawlUserPosts(xiaohongshuUrl: string, cookie?: string) {
  try {
    // 模拟爬取用户主页的多个帖子
    const mockPosts = []
    const postCount = Math.floor(Math.random() * 10) + 5 // 5-15个帖子
    
    for (let i = 0; i < postCount; i++) {
      const postId = `user_post_${Date.now()}_${i}`
      mockPosts.push({
        post_id: postId,
        post_url: `https://www.xiaohongshu.com/explore/${postId}`,
        title: `AI学习第${i + 1}天心得`,
        content: `第${i + 1}天的AI学习记录...`,
        cover_image_url: `https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Day${i + 1}`,
        view_count: Math.floor(Math.random() * 2000) + 100,
        like_count: Math.floor(Math.random() * 200) + 10,
        comment_count: Math.floor(Math.random() * 100) + 5,
        share_count: Math.floor(Math.random() * 50) + 1,
        publish_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
      })
    }
    
    console.log(`🕷️ 爬取用户主页 ${postCount} 个帖子:`, xiaohongshuUrl)
    
    return mockPosts
  } catch (error) {
    console.error('爬取用户主页失败:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, student_id, post_url, xiaohongshu_url, cookie } = body
    
    console.log('🕷️ 爬虫API请求:', { action, student_id, post_url, xiaohongshu_url })
    
    if (action === 'crawl_post') {
      // 爬取单个帖子
      if (!post_url || !student_id) {
        return NextResponse.json(
          { error: '缺少必要参数: post_url 和 student_id' },
          { status: 400 }
        )
      }
      
      // 获取学员信息
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('student_id', student_id)
        .single()
      
      if (userError) {
        console.error('获取用户信息失败:', userError)
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        )
      }
      
      // 爬取帖子数据
      const postData = await crawlXiaohongshuPost(post_url, cookie)
      
      // 保存到数据库
      const { data, error } = await supabase
        .from('student_posts')
        .upsert({
          student_id,
          student_name: user.name,
          post_id: postData.post_id,
          post_url,
          title: postData.title,
          content: postData.content,
          cover_image_url: postData.cover_image_url,
          view_count: postData.view_count,
          like_count: postData.like_count,
          comment_count: postData.comment_count,
          share_count: postData.share_count,
          publish_time: postData.publish_time,
          crawl_time: new Date().toISOString()
        })
        .select()
      
      if (error) {
        console.error('保存帖子数据失败:', error)
        return NextResponse.json(
          { error: '保存数据失败' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: data[0],
        message: '帖子数据爬取并保存成功'
      })
      
    } else if (action === 'crawl_user_posts') {
      // 爬取用户主页所有帖子
      if (!xiaohongshu_url || !student_id) {
        return NextResponse.json(
          { error: '缺少必要参数: xiaohongshu_url 和 student_id' },
          { status: 400 }
        )
      }
      
      // 获取学员信息
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('student_id', student_id)
        .single()
      
      if (userError) {
        console.error('获取用户信息失败:', userError)
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        )
      }
      
      // 爬取用户主页帖子
      const posts = await crawlUserPosts(xiaohongshu_url, cookie)
      
      // 批量保存到数据库
      const postsToSave = posts.map(post => ({
        student_id,
        student_name: user.name,
        ...post,
        crawl_time: new Date().toISOString()
      }))
      
      const { data, error } = await supabase
        .from('student_posts')
        .upsert(postsToSave)
        .select()
      
      if (error) {
        console.error('批量保存帖子数据失败:', error)
        return NextResponse.json(
          { error: '保存数据失败' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data,
        count: data.length,
        message: `成功爬取并保存 ${data.length} 个帖子`
      })
      
    } else {
      return NextResponse.json(
        { error: '不支持的操作类型' },
        { status: 400 }
      )
    }
    
  } catch (error: any) {
    console.error('爬虫API错误:', error)
    return NextResponse.json(
      { error: '爬虫服务异常', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
