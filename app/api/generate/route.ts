import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('API /generate called')
    const body = await request.json()
    console.log('Request body:', body)
    const { student_id, user_input, angle, day_number } = body

    if (!student_id || !user_input || !angle || !day_number) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // 获取用户人设信息
    const { data: supabaseUserData, error: userError } = await supabase
      .from('users')
      .select('student_id, persona, keywords, vision')
      .eq('student_id', student_id)
      .single()

    let userData;
    if (userError || !supabaseUserData) {
      console.error('Supabase query error or user not found:', userError)
      console.log('使用测试用户数据绕过Supabase问题')
      
      // 为了测试，使用模拟用户数据
      userData = {
        student_id: student_id,
        persona: 'AI学习达人，专注效率提升和工具分享',
        keywords: 'AI工具,效率提升,学习方法',
        vision: '90天后成为AI应用专家，帮助更多人提升工作效率'
      }
      
      console.log('使用模拟用户数据:', userData)
    } else {
      userData = supabaseUserData
      console.log('使用Supabase用户数据:', userData)
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
            day_number: parseInt(day_number) || 1
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
        console.log('Dify response headers:', Object.fromEntries(difyResponse.headers.entries()))

        if (difyResponse.ok) {
          const result = await difyResponse.json()
          console.log('===== DIFY RESPONSE ANALYSIS =====')
          console.log('Raw Dify response:', JSON.stringify(result, null, 2))
          console.log('Response type:', typeof result)
          console.log('Response keys:', Object.keys(result))
          
          if (result.data) {
            console.log('result.data exists:', result.data)
            console.log('result.data type:', typeof result.data)
            console.log('result.data keys:', Object.keys(result.data))
            console.log('result.data.titles:', result.data.titles)
            console.log('result.data.bodies:', result.data.bodies)
          }
          
          if (result.answer) {
            console.log('result.answer exists:', result.answer)
          }
          
          if (result.content) {
            console.log('result.content exists:', result.content)
          }
          
          console.log('====================================')
          
          // 处理真实的Dify响应格式 - 数据在data.outputs.structured_output中
          if (result.data && result.data.outputs && result.data.outputs.structured_output) {
            const structuredData = result.data.outputs.structured_output
            console.log('Found Dify structured_output:', structuredData)
            
            return NextResponse.json({
              titles: structuredData.titles || [],
              bodies: structuredData.bodies || [],
              hashtags: structuredData.hashtags || { fixed: [], generated: [] },
              visuals: {
                images: structuredData.visuals?.images || [],
                videos: structuredData.visuals?.videos || []
              },
              dify: true, // 标记这是Dify生成的数据
              task_id: result.task_id,
              workflow_run_id: result.workflow_run_id,
              elapsed_time: result.data.elapsed_time,
              total_tokens: result.data.total_tokens
            })
          }
          
          // 兜底：检查旧的structured_output格式
          if (result.structured_output) {
            const structuredData = result.structured_output
            console.log('Found legacy structured_output:', structuredData)
            
            return NextResponse.json({
              titles: structuredData.titles || [],
              bodies: structuredData.bodies || [],
              hashtags: structuredData.hashtags || { fixed: [], generated: [] },
              visuals: {
                images: structuredData.visuals?.images || [],
                videos: structuredData.visuals?.videos || []
              },
              dify: true // 标记这是Dify生成的数据
            })
          }
          
          // 兜底：检查其他可能的数据格式
          if (result.data && (result.data.titles || result.data.bodies)) {
            return NextResponse.json({
              titles: result.data.titles || [],
              bodies: result.data.bodies || [],
              hashtags: result.data.hashtags || { fixed: [], generated: [] },
              visuals: result.data.visuals || { images: [], videos: [] },
              dify: true
            })
          }
          
          // 最后的兜底方案
          const content = result.answer || result.data?.answer || result.content
          if (content) {
            console.log('Using fallback content parsing')
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
          console.error('===== DIFY API FAILED =====')
          console.error('Status:', difyResponse.status)
          console.error('Status Text:', difyResponse.statusText)
          console.error('Headers:', Object.fromEntries(difyResponse.headers.entries()))
          console.error('Error Response Body:', errorText)
          console.error('Request URL:', process.env.DIFY_API_URL)
          console.error('Request Body was:', JSON.stringify(requestBody, null, 2))
          console.error('============================')
          // 如果Dify失败，降级到模拟数据
        }
      } catch (error) {
        console.error('===== DIFY REQUEST EXCEPTION =====')
        console.error('Error type:', typeof error)
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
        console.error('Full error object:', error)
        console.error('Request was attempting to:', process.env.DIFY_API_URL)
        console.error('==================================')
        // 如果Dify请求失败，降级到模拟数据
      }
    } else {
      console.log('Dify API not configured, using mock data')
    }

    // 降级方案：使用模拟数据
    console.log('===== USING MOCK DATA =====')
    console.log('Reason: Dify API not configured or failed')
    console.log('Environment check:')
    console.log('- DIFY_API_URL exists:', !!process.env.DIFY_API_URL)
    console.log('- DIFY_API_KEY exists:', !!process.env.DIFY_API_KEY)
    console.log('- DIFY_API_URL value:', process.env.DIFY_API_URL)
    console.log('============================')
    
    const mockResponse = {
      titles: [
        { id: 1, content: "🚀 90天AI学习计划，从小白到高手的华丽转身！" },
        { id: 2, content: "⚡ ChatGPT思维导图神器，效率提升300%不是梦！" },
        { id: 3, content: "🎯 AI工具箱大公开，让你的工作如虎添翼" },
        { id: 4, content: "💡 零基础学AI，这些技巧让我事半功倍" },
        { id: 5, content: "🌟 AI创富营第30天打卡，收获满满干货分享" },
        { id: 6, content: "🔥 用AI做副业，月入过万的秘密武器" },
        { id: 7, content: "✨ 学会这个AI技巧，告别加班熬夜！" },
        { id: 8, content: "📈 AI赋能职场，让我在同事中脱颖而出" },
        { id: 9, content: "🎨 AI绘画入门，零基础也能创作惊艳作品" },
        { id: 10, content: "💰 AI变现实战，从想法到收入的完整路径" }
      ],
      bodies: [
        {
          id: 1,
          content: `大家好！今天想和大家分享一个超级实用的AI学习心得✨

最近在爱学AI创富营学习，真的收获满满！特别是学会用ChatGPT做思维导图后，我的学习效率直接提升了3倍！

🔥 我的具体操作：
1. 先让AI帮我梳理知识框架
2. 用思维导图工具可视化展示
3. 结合实际案例加深理解

现在无论是工作汇报还是学习笔记，都变得井井有条。以前需要花2小时整理的内容，现在30分钟就搞定！

#AI学习心得 #效率提升 #思维导图`,
          style: "直接表达型"
        },
        {
          id: 2,
          content: `说实话，刚开始接触AI的时候我也很迷茫🤔

但是加入创富营后，我发现学AI其实有方法论的！

💡 我的三步走策略：
第一步：明确自己的需求点
第二步：选择合适的AI工具
第三步：大量实践+复盘总结

就拿我最近学的ChatGPT来说，从不会提问到现在能写出高质量prompt，只用了2周时间。关键是要敢于试错，每次失败都是在积累经验。

现在我用AI辅助工作，不仅效率提升了，工作质量也明显改善了！

给还在观望的朋友们：行动比完美更重要！`,
          style: "经验分享型"
        }
      ],
      hashtags: { 
        fixed: ["AI学习", "创富营", "效率提升"], 
        generated: ["ChatGPT", "思维导图", "职场技能", "副业赚钱", "AI工具", "学习方法"] 
      },
      visuals: { 
        images: [
          { suggestion: "制作一张对比图，展示使用AI前后的工作效率差异，用数字和图表直观表现提升效果" },
          { suggestion: "设计思维导图截图，展示AI辅助整理的知识结构，配色要清晰美观" }
        ],
        videos: [
          { suggestion: "录制屏幕操作视频，演示如何用ChatGPT生成思维导图的完整流程" },
          { suggestion: "制作时间轴视频，展示90天学习计划的关键节点和阶段性成果" }
        ]
      },
      mock: true
    }
    
    console.log('Mock response prepared:', JSON.stringify(mockResponse, null, 2))
    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}