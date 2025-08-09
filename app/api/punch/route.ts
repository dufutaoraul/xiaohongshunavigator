import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, post_url } = body

    if (!student_id || !post_url) {
      return NextResponse.json(
        { error: 'student_id and post_url are required' },
        { status: 400 }
      )
    }

    // 验证URL格式
    if (!post_url.includes('xiaohongshu.com') && !post_url.includes('xhs.com')) {
      return NextResponse.json(
        { error: 'Invalid Xiaohongshu URL' },
        { status: 400 }
      )
    }

    // 检查用户是否存在
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', student_id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found. Please set up your profile first.' },
        { status: 404 }
      )
    }

    // 检查URL是否已经提交过
    const { data: existingPunch, error: checkError } = await supabase
      .from('punch_cards')
      .select('id')
      .eq('post_url', post_url)
      .single()

    if (existingPunch) {
      return NextResponse.json(
        { error: 'This post URL has already been submitted.' },
        { status: 409 }
      )
    }

    // 调用 N8N 工作流处理打卡逻辑（包括数据抓取）
    let postData = {
      post_created_at: new Date().toISOString(), // V1简化版本，使用当前时间
      likes: 0,
      comments: 0,
      collections: 0
    }

    if (process.env.N8N_WEBHOOK_URL_PUNCH) {
      try {
        const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL_PUNCH, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.N8N_API_KEY && { 'Authorization': `Bearer ${process.env.N8N_API_KEY}` })
          },
          body: JSON.stringify({
            student_id,
            post_url,
            user_id: userData.id
          })
        })

        if (n8nResponse.ok) {
          const result = await n8nResponse.json()
          if (result.post_data) {
            postData = {
              post_created_at: result.post_data.created_at || postData.post_created_at,
              likes: result.post_data.likes || 0,
              comments: result.post_data.comments || 0,
              collections: result.post_data.collections || 0
            }
          }
        } else {
          console.error('N8N punch workflow failed:', await n8nResponse.text())
          // 使用默认数据
        }
      } catch (error) {
        console.error('N8N punch request failed:', error)
        // 使用默认数据
      }
    } else {
      // 如果没有配置N8N，使用模拟数据
      console.log('Using mock data - N8N punch webhook not configured')
      postData = {
        post_created_at: new Date().toISOString(),
        likes: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 100),
        collections: Math.floor(Math.random() * 200)
      }
    }

    // 插入打卡记录
    const { data, error } = await supabase
      .from('punch_cards')
      .insert({
        user_id: userData.id,
        submitted_at: new Date().toISOString(),
        post_url: post_url,
        post_created_at: postData.post_created_at,
        likes: postData.likes,
        comments: postData.comments,
        collections: postData.collections
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save punch record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Punch card submitted successfully',
      data: data
    })

    /* 实际实现应该调用真实的数据抓取API：
    const scrapingResponse = await fetch(process.env.SCRAPING_API_URL!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SCRAPING_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: post_url })
    })

    const postData = await scrapingResponse.json()
    */
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}