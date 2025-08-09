import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, user_input, angle } = body

    if (!student_id || !user_input || !angle) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // 获取用户人设信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', student_id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found. Please set up your profile first.' },
        { status: 404 }
      )
    }

    // 调用 N8N 工作流进行内容生成
    if (process.env.N8N_WEBHOOK_URL_GENERATE) {
      try {
        const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL_GENERATE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.N8N_API_KEY && { 'Authorization': `Bearer ${process.env.N8N_API_KEY}` })
          },
          body: JSON.stringify({
            student_id,
            user_input,
            angle,
            user_data: userData
          })
        })

        if (n8nResponse.ok) {
          const result = await n8nResponse.json()
          return NextResponse.json({
            content: result.content || result.generated_content,
            visual_suggestions: result.visual_suggestions || result.visual_advice
          })
        } else {
          console.error('N8N workflow failed:', await n8nResponse.text())
          // 如果N8N失败，降级到模拟数据
        }
      } catch (error) {
        console.error('N8N request failed:', error)
        // 如果N8N请求失败，降级到模拟数据
      }
    }

    // 降级方案：使用模拟数据
    console.log('Using mock data - N8N webhook not configured or failed')
    const mockContent = generateMockContent(userData, user_input, angle)
    const mockVisualSuggestions = generateMockVisualSuggestions(angle)

    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1500))

    return NextResponse.json({
      content: mockContent,
      visual_suggestions: mockVisualSuggestions,
      mock: true // 标记这是模拟数据
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateMockContent(userData: any, userInput: string, angle: string): string {
  const angleMap: { [key: string]: string } = {
    experience: '踩坑经验分享',
    efficiency: '效率提升技巧',
    beginner: '新手入门指南',
    case_study: '案例深度分析',
    tools: '实用工具推荐'
  }

  return `🌟 ${angleMap[angle]} | ${userData.persona}

📝 ${userInput}

✨ 关键要点：
1. 基于${userData.keywords.split(',')[0]}领域的实战经验
2. ${userData.keywords.split(',')[1] || '相关技能'}的具体应用
3. 向着"${userData.vision}"目标迈进

💡 核心价值：
通过今天的学习和实践，我发现...
[这里会根据你的人设和输入生成个性化内容]

🔥 实用建议：
• 建议1：...
• 建议2：...  
• 建议3：...

📈 成长感悟：
[基于你的90天愿景生成的感悟内容]

#AI学习 #${userData.keywords.split(',')[0]} #个人成长 #副业赚钱

---
💬 你在这个领域有什么经验？评论区交流~`
}

function generateMockVisualSuggestions(angle: string): string {
  const suggestions: { [key: string]: string } = {
    experience: `📸 配图建议：
• 对比图：使用前后效果对比
• 截图：展示踩坑时的错误界面和正确界面
• 表情包：用来表达踩坑时的心情

🎥 视频建议：
• 制作踩坑过程的时间线视频
• 录制解决问题的操作步骤
• 加入轻松幽默的配音解说`,

    efficiency: `📸 配图建议：
• 数据对比图：效率提升前后的数据对比
• 工具截图：展示使用的效率工具界面
• 时间管理图表

🎥 视频建议：
• 快进展示工作流程优化
• 分屏对比：传统方法 vs 高效方法
• 制作操作教程视频`,

    beginner: `📸 配图建议：
• 步骤图：分步骤展示入门流程
• 思维导图：新手学习路径图
• 对话截图：新手常见问题Q&A

🎥 视频建议：
• 新手教学视频：从0到1的过程
• 常见错误合集和解决方案
• 学习资源推荐视频`,

    case_study: `📸 配图建议：
• 案例截图：成功案例的关键数据
• 流程图：案例分析的思维过程
• 结果展示：最终成果图

🎥 视频建议：
• 案例拆解视频：深度分析成功要素
• 复盘视频：经验总结和反思
• 应用演示：如何运用到自己的项目`,

    tools: `📸 配图建议：
• 工具界面截图：清晰展示工具功能
• 对比图：不同工具的优缺点对比
• 使用效果图：工具产出的成果展示

🎥 视频建议：
• 工具操作演示：详细使用教程
• 多工具对比测评视频
• 工具组合使用的最佳实践`
  }

  return suggestions[angle] || suggestions.experience
}