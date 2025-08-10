import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('API /generate called')
    const body = await request.json()
    console.log('Request body:', body)
    const { student_id, user_input, angle } = body

    if (!student_id || !user_input || !angle) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // 获取用户人设信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('student_id, persona, keywords, vision')
      .eq('student_id', student_id)
      .single()

    if (userError) {
      console.error('Supabase query error:', userError)
      return NextResponse.json(
        { error: 'User not found. Please set up your profile first.' },
        { status: 404 }
      )
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found. Please set up your profile first.' },
        { status: 404 }
      )
    }

    // 调用 Dify 工作流进行内容生成
    console.log('Environment check:', {
      hasApiUrl: !!process.env.DIFY_API_URL,
      hasApiKey: !!process.env.DIFY_API_KEY,
      apiUrl: process.env.DIFY_API_URL
    })
    
    if (process.env.DIFY_API_URL && process.env.DIFY_API_KEY) {
      try {
        // 构建Dify API请求 - 根据提供的准确格式
        console.log('Making Dify API request...')
        const requestBody = {
          inputs: {
            persona: userData.persona || "",
            keywords: userData.keywords || "",
            vision: userData.vision || "",
            user_input: user_input,
            angle: angle,
            day_number: 1
          },
          response_mode: "blocking",
          user: student_id
        }
        console.log('Request body:', JSON.stringify(requestBody, null, 2))
        
        const difyResponse = await fetch(process.env.DIFY_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DIFY_API_KEY}`
          },
          body: JSON.stringify(requestBody)
        })

        console.log('Dify response status:', difyResponse.status)

        if (difyResponse.ok) {
          const result = await difyResponse.json()
          console.log('Dify response data:', result)
          
          // 根据您提供的返回数据结构处理
          if (result.data && (result.data.titles || result.data.bodies)) {
            return NextResponse.json({
              titles: result.data.titles || [],
              bodies: result.data.bodies || [],
              hashtags: result.data.hashtags || { fixed: [], generated: [] },
              visuals: result.data.visuals || { images: [], videos: [] },
              dify: true // 标记这是Dify生成的数据
            })
          }
          
          // 如果返回格式不匹配，尝试解析其他可能的格式
          const content = result.answer || result.data?.answer || result.content
          if (content) {
            // 简单转换为前端需要的格式
            return NextResponse.json({
              titles: [{ id: 1, content: "✨ AI生成的专属内容分享" }],
              bodies: [{ id: 1, content: content, style: "AI智能生成" }],
              hashtags: { fixed: ["AI学习", "创富营", "效率提升"], generated: ["AI工具", "学习方法", "个人成长"] },
              visuals: { 
                images: [{ suggestion: "根据内容主题制作相关配图，突出重点信息" }],
                videos: [{ suggestion: "制作内容相关的短视频，增强表达效果" }]
              },
              dify: true
            })
          }
        } else {
          const errorText = await difyResponse.text()
          console.error('Dify API failed:', {
            status: difyResponse.status,
            statusText: difyResponse.statusText,
            error: errorText
          })
          // 如果Dify失败，降级到模拟数据
        }
      } catch (error) {
        console.error('Dify request failed:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          error
        })
        // 如果Dify请求失败，降级到模拟数据
      }
    } else {
      console.log('Dify API not configured, using mock data')
    }

    // 降级方案：使用模拟数据
    console.log('Using mock data - Dify API not configured or failed')
    return NextResponse.json({
      titles: [{ id: 1, content: "🚀 90天AI学习计划，从小白到高手的华丽转身！" }],
      bodies: [{
        id: 1,
        content: `大家好！今天想和大家分享一个超级实用的AI学习心得✨

最近在爱学AI创富营学习，真的收获满满！特别是学会用ChatGPT做思维导图后，我的学习效率直接提升了3倍！

🔥 我的具体操作：
1. 先让AI帮我梳理知识框架
2. 用思维导图工具可视化展示
3. 结合实际案例加深理解

现在无论是工作汇报还是学习笔记，都变得井井有条。以前需要花2小时整理的内容，现在30分钟就搞定！

#AI学习心得 #效率提升 #思维导图`,
        style: "降级模拟数据"
      }],
      hashtags: { fixed: ["AI学习", "创富营", "效率提升"], generated: ["ChatGPT", "思维导图", "职场技能"] },
      visuals: { 
        images: [{ suggestion: "制作一张对比图，展示使用AI前后的工作效率差异" }],
        videos: [{ suggestion: "录制屏幕操作视频，演示如何用ChatGPT生成思维导图" }]
      },
      mock: true
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}