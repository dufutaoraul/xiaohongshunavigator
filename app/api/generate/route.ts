import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用环境变量创建Supabase客户端，支持构建时的占位符
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// 在构建时检查环境变量
if (typeof window === 'undefined' && (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co')) {
  console.warn('Supabase URL not configured properly for build in generate route')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

    // 调用 N8N 工作流进行内容生成
    const n8nWebhookUrl = 'https://n8n.aifunbox.com/webhook-test/7fd7257d-ed4c-44c3-8179-bc035ab51ae3'
    console.log('Using N8N webhook URL:', n8nWebhookUrl)
    
    try {
      // 构建N8N API请求
      console.log('Making N8N API request...')
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
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时
      
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })
        
      clearTimeout(timeoutId)

      console.log('N8N response status:', n8nResponse.status)
      console.log('N8N response headers:', Object.fromEntries(n8nResponse.headers.entries()))

      if (n8nResponse.ok) {
        // 先获取响应文本，避免JSON解析问题
        const responseText = await n8nResponse.text()
          console.log('Raw response text length:', responseText.length)
          console.log('Raw response text preview:', responseText.substring(0, 200) + '...')
          
          // 尝试解析为JSON
          let rawResult
          try {
            rawResult = JSON.parse(responseText)
          } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError)
            console.error('Response text:', responseText.substring(0, 1000))
            throw new Error('Invalid JSON response from N8N')
          }
          console.log('===== N8N RESPONSE ANALYSIS =====')
          console.log('Raw N8N response:', JSON.stringify(rawResult, null, 2))
          console.log('Response type:', typeof rawResult)
          
          let result = rawResult
          
          // 检查是否返回的是字符串化的JSON（被双引号包裹）
          if (typeof rawResult === 'string') {
            try {
              // 清理字符串格式
              let cleanedString = rawResult
              
              // 移除最外层的双重引号包装 ""content""
              if (cleanedString.startsWith('""') && cleanedString.endsWith('""')) {
                cleanedString = cleanedString.slice(2, -2)
                console.log('Removed double quotes wrapper')
              }
              
              // 处理转义字符和换行符
              cleanedString = cleanedString
                .replace(/\\n/g, '\n')  // 转义的换行符转为真实换行符
                .replace(/\\"/g, '"')   // 转义的引号转为真实引号
                .replace(/\\\\/g, '\\') // 转义的反斜杠
              
              console.log('Cleaned string sample:', cleanedString.substring(0, 200) + '...')
              
              result = JSON.parse(cleanedString)
              console.log('Successfully parsed cleaned JSON')
            } catch (parseError) {
              console.error('Failed to parse stringified JSON:', parseError)
              console.error('Raw string content sample:', rawResult.substring(0, 500) + '...')
              const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error'
              throw new Error(`JSON parsing failed: ${errorMessage}`)
            }
          }
          
          // 如果result中有字符串字段包含JSON，也尝试解析
          if (result.answer && typeof result.answer === 'string' && result.answer.startsWith('{')) {
            try {
              const parsedAnswer = JSON.parse(result.answer)
              console.log('Found JSON in answer field:', parsedAnswer)
              result = { ...result, parsedAnswer }
            } catch (e) {
              console.log('answer field is not valid JSON, keeping as string')
            }
          }
          
          console.log('Final processed result keys:', Object.keys(result))
          console.log('====================================')
          
          // 首先检查直接的structured_output格式（新的Dify输出）
          if (result.structured_output) {
            const structuredData = result.structured_output
            console.log('Found direct structured_output:', structuredData)
            
            // 处理缺失的hashtags字段
            let hashtags = []
            if (Array.isArray(structuredData.hashtags)) {
              hashtags = structuredData.hashtags
            } else {
              // 如果没有hashtags，提供默认标签
              hashtags = ["#爱学AI创富营", "#爱学AI社区", "#爱学AI90天陪跑打卡", "#爱学AI深潜计划", "AI工具", "效率提升", "学习方法"]
              console.log('Using default hashtags as none provided')
            }
            
            // 处理visuals字段
            const visuals = {
              images: structuredData.visuals?.images || [],
              videos: structuredData.visuals?.videos || []
            }
            
            // 如果没有videos，添加默认建议
            if (visuals.videos.length === 0) {
              visuals.videos = [
                { id: 1, suggestion: "制作操作演示视频，展示完整的实践过程" },
                { id: 2, suggestion: "录制学习心得分享视频，增加真实感和互动性" }
              ]
              console.log('Added default video suggestions')
            }
            
            return NextResponse.json({
              titles: structuredData.titles || [],
              bodies: structuredData.bodies || [],
              hashtags: hashtags,
              visuals: visuals,
              n8n: true,
              source: 'direct_structured_output'
            })
          }
          
          // 检查parsedAnswer中的structured_output
          if (result.parsedAnswer && result.parsedAnswer.structured_output) {
            const structuredData = result.parsedAnswer.structured_output
            console.log('Found structured_output in parsed answer:', structuredData)
            
            // 处理缺失的hashtags字段
            let hashtags = []
            if (Array.isArray(structuredData.hashtags)) {
              hashtags = structuredData.hashtags
            } else {
              hashtags = ["#爱学AI创富营", "#爱学AI社区", "#爱学AI90天陪跑打卡", "#爱学AI深潜计划", "AI工具", "效率提升", "学习方法"]
              console.log('Using default hashtags as none provided in parsed answer')
            }
            
            // 处理visuals字段
            const visuals = {
              images: structuredData.visuals?.images || [],
              videos: structuredData.visuals?.videos || []
            }
            
            if (visuals.videos.length === 0) {
              visuals.videos = [
                { id: 1, suggestion: "制作操作演示视频，展示完整的实践过程" },
                { id: 2, suggestion: "录制学习心得分享视频，增加真实感和互动性" }
              ]
              console.log('Added default video suggestions in parsed answer')
            }
            
            return NextResponse.json({
              titles: structuredData.titles || [],
              bodies: structuredData.bodies || [],
              hashtags: hashtags,
              visuals: visuals,
              n8n: true,
              source: 'parsed_answer_structured_output'
            })
          }
          
          // 处理传统的Dify响应格式 - 数据在data.outputs.structured_output中
          if (result.data && result.data.outputs && result.data.outputs.structured_output) {
            const structuredData = result.data.outputs.structured_output
            console.log('Found Dify structured_output:', structuredData)
            
            return NextResponse.json({
              titles: structuredData.titles || [],
              bodies: structuredData.bodies || [],
              hashtags: Array.isArray(structuredData.hashtags) ? structuredData.hashtags : [],
              visuals: {
                images: structuredData.visuals?.images || [],
                videos: structuredData.visuals?.videos || []
              },
              n8n: true, // 标记这是Dify生成的数据
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
              hashtags: Array.isArray(structuredData.hashtags) ? structuredData.hashtags : [],
              visuals: {
                images: structuredData.visuals?.images || [],
                videos: structuredData.visuals?.videos || []
              },
              n8n: true // 标记这是Dify生成的数据
            })
          }
          
          // 兜底：检查其他可能的数据格式
          if (result.data && (result.data.titles || result.data.bodies)) {
            return NextResponse.json({
              titles: result.data.titles || [],
              bodies: result.data.bodies || [],
              hashtags: Array.isArray(result.data.hashtags) ? result.data.hashtags : [],
              visuals: result.data.visuals || { images: [], videos: [] },
              n8n: true
            })
          }
          
          // 最后的兜底方案
          const content = result.answer || result.data?.answer || result.content
          if (content) {
            console.log('Using fallback content parsing')
            return NextResponse.json({
              titles: [{ id: 1, content: "✨ AI生成的专属内容分享" }],
              bodies: [{ id: 1, content: content, style: "AI智能生成" }],
              hashtags: ["#爱学AI创富营", "#爱学AI社区", "#爱学AI90天陪跑打卡", "#爱学AI深潜计划", "AI工具", "学习方法", "个人成长"],
              visuals: { 
                images: [{ id: 1, suggestion: "根据内容主题制作相关配图，突出重点信息" }],
                videos: [{ id: 1, suggestion: "制作内容相关的短视频，增强表达效果" }]
              },
              n8n: true
            })
          }
        } else {
        const errorText = await n8nResponse.text()
        console.error('===== N8N API FAILED =====')
        console.error('Status:', n8nResponse.status)
        console.error('Status Text:', n8nResponse.statusText)
        console.error('Headers:', Object.fromEntries(n8nResponse.headers.entries()))
          console.error('Error Response Body:', errorText)
        console.error('Request URL:', n8nWebhookUrl)
          console.error('Request Body was:', JSON.stringify(requestBody, null, 2))
          console.error('============================')
        // 如果N8N失败，降级到模拟数据
        }
      } catch (error) {
      console.error('===== N8N REQUEST EXCEPTION =====')
      console.error('Error type:', typeof error)
      console.error('Error name:', error instanceof Error ? error.name : 'Unknown')
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      console.error('Request was attempting to:', n8nWebhookUrl)
        
        // 特别处理超时错误
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('Request was aborted due to timeout (60s)')
        }
        
      console.error('==================================')
      // 如果N8N请求失败，降级到模拟数据
    }

    // 降级方案：使用模拟数据
    console.log('===== USING MOCK DATA =====')
    console.log('Reason: N8N API failed')
    console.log('Using N8N webhook URL:', n8nWebhookUrl)
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
      hashtags: ["#爱学AI创富营", "#爱学AI社区", "#爱学AI90天陪跑打卡", "#爱学AI深潜计划", "ChatGPT", "思维导图", "职场技能", "副业赚钱", "AI工具", "学习方法"],
      visuals: { 
        images: [
          { id: 1, suggestion: "制作一张对比图，展示使用AI前后的工作效率差异，用数字和图表直观表现提升效果" },
          { id: 2, suggestion: "设计思维导图截图，展示AI辅助整理的知识结构，配色要清晰美观" }
        ],
        videos: [
          { id: 1, suggestion: "录制屏幕操作视频，演示如何用ChatGPT生成思维导图的完整流程" },
          { id: 2, suggestion: "制作时间轴视频，展示90天学习计划的关键节点和阶段性成果" }
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