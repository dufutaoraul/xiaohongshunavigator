'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '../components/Card'
import Textarea from '../components/Textarea'
import Button from '../components/Button'
import StudentInput from '../components/StudentInput'

export default function GeneratePage() {
  const [studentId, setStudentId] = useState('')
  const [userInput, setUserInput] = useState('')
  const [selectedAngle, setSelectedAngle] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [visualSuggestions, setVisualSuggestions] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const angles = [
    { value: 'experience', label: '踩坑经验' },
    { value: 'efficiency', label: '效率提升' },
    { value: 'beginner', label: '新手建议' },
    { value: 'case_study', label: '案例分析' },
    { value: 'tools', label: '工具推荐' }
  ]

  const generateMockData = () => {
    return {
      titles: [
        { content: "🚀 90天AI学习计划，从小白到高手的华丽转身！" },
        { content: "⚡ ChatGPT思维导图神器，效率提升300%不是梦！" },
        { content: "🎯 AI工具箱大公开，让你的工作如虎添翼" },
        { content: "💡 零基础学AI，这些技巧让我事半功倍" },
        { content: "🌟 AI创富营第30天打卡，收获满满干货分享" },
        { content: "🔥 用AI做副业，月入过万的秘密武器" },
        { content: "✨ 学会这个AI技巧，告别加班熬夜！" },
        { content: "📈 AI赋能职场，让我在同事中脱颖而出" },
        { content: "🎨 AI绘画入门，零基础也能创作惊艳作品" },
        { content: "💰 AI变现实战，从想法到收入的完整路径" }
      ],
      bodies: [
        {
          content: `大家好！今天想和大家分享一个超级实用的AI学习心得✨\n\n最近在爱学AI创富营学习，真的收获满满！特别是学会用ChatGPT做思维导图后，我的学习效率直接提升了3倍！\n\n🔥 我的具体操作：\n1. 先让AI帮我梳理知识框架\n2. 用思维导图工具可视化展示\n3. 结合实际案例加深理解\n\n现在无论是工作汇报还是学习笔记，都变得井井有条。以前需要花2小时整理的内容，现在30分钟就搞定！\n\n#AI学习心得 #效率提升 #思维导图`,
          style: "直接表达型"
        },
        {
          content: `说实话，刚开始接触AI的时候我也很迷茫🤔\n\n但是加入创富营后，我发现学AI其实有方法论的！\n\n💡 我的三步走策略：\n第一步：明确自己的需求点\n第二步：选择合适的AI工具\n第三步：大量实践+复盘总结\n\n就拿我最近学的ChatGPT来说，从不会提问到现在能写出高质量prompt，只用了2周时间。关键是要敢于试错，每次失败都是在积累经验。\n\n现在我用AI辅助工作，不仅效率提升了，工作质量也明显改善了！\n\n给还在观望的朋友们：行动比完美更重要！`,
          style: "经验分享型"
        },
        {
          content: `⚠️ 新手学AI必须避开的3个大坑！\n\n我踩过的坑你们不要再踩了😭\n\n❌ 坑1：盲目追求高级功能\n✅ 正解：从基础开始，扎实掌握\n\n❌ 坑2：只学不练，理论派\n✅ 正解：边学边用，实践出真知\n\n❌ 坑3：孤军奋战，闭门造车\n✅ 正解：找到靠谱社群，抱团学习\n\n我在创富营最大的收获就是找到了一群志同道合的伙伴，大家互相分享经验，共同进步。现在看着自己从AI小白成长到可以独当一面，真的很有成就感！\n\n#AI学习 #新手避坑 #经验分享`,
          style: "避坑指南型"
        }
      ],
      hashtags: {
        fixed: ["AI学习", "创富营", "效率提升"],
        generated: ["ChatGPT", "思维导图", "职场技能", "副业赚钱", "AI工具", "学习方法"]
      },
      visuals: {
        images: [
          { suggestion: "制作一张对比图，展示使用AI前后的工作效率差异，用数字和图表直观表现提升效果" },
          { suggestion: "设计思维导图截图，展示AI辅助整理的知识结构，配色要清晰美观" },
          { suggestion: "制作学习打卡日历图，标记每天的学习进度和收获，体现坚持的力量" }
        ],
        videos: [
          { suggestion: "录制屏幕操作视频，演示如何用ChatGPT生成思维导图的完整流程" },
          { suggestion: "制作时间轴视频，展示90天学习计划的关键节点和阶段性成果" },
          { suggestion: "拍摄学习环境vlog，分享高效学习的工具和方法，营造真实感" }
        ]
      }
    }
  }

  const handleGenerate = async () => {
    if (!studentId.trim() || !userInput.trim() || !selectedAngle) {
      setMessage('请填写所有必填项')
      return
    }

    setLoading(true)
    setMessage('')
    setGeneratedContent('')
    setVisualSuggestions('')

    try {
      // 调用API生成内容
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: studentId,
          user_input: userInput,
          angle: selectedAngle
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '生成失败')
      }

      const result = await response.json()
      
      // 处理Dify返回的数据格式，转换为前端所需格式
      let mockData
      if (result.dify) {
        // Dify返回的是原始内容，需要转换格式
        mockData = convertDifyResponseToMockFormat(result.content, result.visual_suggestions)
      } else {
        // 使用模拟数据时仍使用原有格式
        mockData = generateMockData()
        setMessage('⚠️ 当前使用模拟数据，请配置Dify API以获得真实AI生成内容')
      }
      
      // 保存数据到localStorage
      localStorage.setItem('generatedContent', JSON.stringify(mockData))
      
      // 设置成功消息
      setMessage(`内容生成成功${result.dify ? ' (Dify AI生成)' : ' (模拟数据)'}！正在跳转到结果页面...`)
      
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        router.push('/result')
      }, 1000)
      
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '网络错误，请检查连接')
      console.error('Generate error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 转换Dify响应为前端所需格式的函数
  const convertDifyResponseToMockFormat = (content: string, visualSuggestions: string) => {
    // 尝试从content中提取标题和正文
    const lines = content.split('\n').filter(line => line.trim())
    
    // 提取可能的标题（以emoji开头或较短的行）
    const titles = lines
      .filter(line => line.length < 100 && (line.includes('🔥') || line.includes('✨') || line.includes('💡')))
      .slice(0, 3)
      .map(title => ({ content: title }))
    
    // 如果没有找到合适的标题，生成一些默认标题
    if (titles.length === 0) {
      titles.push({ content: "✨ AI生成的专属内容分享" })
    }

    // 从内容中提取标签
    const hashtagMatches = content.match(/#[\u4e00-\u9fa5a-zA-Z0-9]+/g) || []
    const extractedTags = hashtagMatches.map(tag => tag.replace('#', ''))
    
    return {
      titles,
      bodies: [{
        content: content,
        style: "AI智能生成"
      }],
      hashtags: {
        fixed: ["AI学习", "创富营", "效率提升"],
        generated: extractedTags.length > 0 ? extractedTags : ["AI工具", "学习方法", "个人成长"]
      },
      visuals: {
        images: [
          { suggestion: visualSuggestions || "根据内容主题制作相关配图，突出重点信息" }
        ],
        videos: [
          { suggestion: "制作内容相关的短视频，增强表达效果" }
        ]
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center fade-in-up">
        <h1 className="text-4xl font-bold gradient-text mb-6">🤖 AI灵感内容引擎</h1>
        <p className="text-xl text-white/80">
          输入你的学习主题和灵感，AI将基于你的个人IP设定生成专属内容 🚀
        </p>
      </div>

      <Card title="内容生成设置" icon="⚡" className="mb-8">
        <div className="space-y-6">
          <StudentInput
            value={studentId}
            onChange={setStudentId}
            required
          />

          <Textarea
            label="今日学习主题/灵感"
            placeholder="描述你想要分享的内容主题，例如：今天学会了用ChatGPT做思维导图，效率提升了3倍"
            value={userInput}
            onChange={setUserInput}
            required
            rows={4}
          />

          <div>
            <label className="block text-sm font-semibold text-white mb-4">
              分享角度 <span className="text-pink-400 ml-1">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {angles.map((angle) => (
                <button
                  key={angle.value}
                  onClick={() => setSelectedAngle(angle.value)}
                  className={`px-4 py-3 rounded-lg border text-center transition-all duration-300 ${
                    selectedAngle === angle.value
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-purple-500 shadow-lg shadow-purple-500/25 transform scale-105'
                      : 'glass-effect text-white border-white/30 hover:border-purple-400 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/10'
                  }`}
                >
                  {angle.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? '生成中...' : '生成内容'}
          </Button>

          {message && (
            <div className={`p-4 rounded-lg glass-effect border-l-4 ${
              message.includes('成功') 
                ? 'border-green-400 text-green-200' 
                : 'border-red-400 text-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>
      </Card>

      {(generatedContent || visualSuggestions) && (
        <>
          <Card title="生成的文案内容" icon="✨" className="mb-8">
            <div className="glass-effect p-6 rounded-lg border border-white/10">
              <pre className="whitespace-pre-wrap text-sm text-white/90 leading-relaxed">
                {generatedContent || '✨ 内容生成中，请稍候...'}
              </pre>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => navigator.clipboard.writeText(generatedContent)}>
              📋 复制文案
            </Button>
          </Card>

          <Card title="配图/视频建议" icon="🎨">
            <div className="glass-effect p-6 rounded-lg border border-white/10">
              <pre className="whitespace-pre-wrap text-sm text-white/90 leading-relaxed">
                {visualSuggestions || '🎨 视觉建议生成中，请稍候...'}
              </pre>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}