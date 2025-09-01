'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '../components/Card'
import Textarea from '../components/Textarea'
import Button from '../components/Button'

export default function GeneratePage() {
  const [studentId, setStudentId] = useState('')
  const [userName, setUserName] = useState('')
  const [userInput, setUserInput] = useState('')
  const [selectedAngle, setSelectedAngle] = useState('')
  const [dayNumber, setDayNumber] = useState('1')
  const [generatedContent, setGeneratedContent] = useState('')
  const [visualSuggestions, setVisualSuggestions] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userProfile, setUserProfile] = useState({ persona: '', keywords: '', vision: '' })
  const router = useRouter()

  // 检查认证状态并获取用户信息
  useEffect(() => {
    const userSession = localStorage.getItem('userSession')
    if (userSession) {
      try {
        const { student_id, name, isAuthenticated } = JSON.parse(userSession)
        if (isAuthenticated) {
          setIsAuthenticated(true)
          setStudentId(student_id)
          setUserName(name || '')
          fetchUserProfile(student_id)
        } else {
          router.push('/profile')
        }
      } catch {
        router.push('/profile')
      }
    } else {
      router.push('/profile')
    }
  }, [])

  const fetchUserProfile = async (studentId: string) => {
    try {
      const response = await fetch(`/api/user?student_id=${studentId}`)
      if (response.ok) {
        const userData = await response.json()
        setUserProfile({
          persona: userData.persona || '',
          keywords: userData.keywords || '',
          vision: userData.vision || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
  }

  const angles = [
    { value: '踩坑经验', label: '踩坑经验' },
    { value: '效率提升', label: '效率提升' },
    { value: '新手建议', label: '新手建议' },
    { value: '案例分析', label: '案例分析' },
    { value: '工具推荐', label: '工具推荐' }
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
      hashtags: ["#爱学AI创富营", "#爱学AI社区", "#爱学AI90天陪跑打卡", "#爱学AI深潜计划", "ChatGPT", "思维导图", "职场技能", "副业赚钱", "AI工具", "学习方法"],
      visuals: {
        images: [
          { id: 1, suggestion: "制作一张对比图，展示使用AI前后的工作效率差异，用数字和图表直观表现提升效果" },
          { id: 2, suggestion: "设计思维导图截图，展示AI辅助整理的知识结构，配色要清晰美观" },
          { id: 3, suggestion: "制作学习打卡日历图，标记每天的学习进度和收获，体现坚持的力量" }
        ],
        videos: [
          { id: 1, suggestion: "录制屏幕操作视频，演示如何用ChatGPT生成思维导图的完整流程" },
          { id: 2, suggestion: "制作时间轴视频，展示90天学习计划的关键节点和阶段性成果" },
          { id: 3, suggestion: "拍摄学习环境vlog，分享高效学习的工具和方法，营造真实感" }
        ]
      }
    }
  }

  const handleGenerate = async () => {
    if (!userInput.trim() || !selectedAngle || !dayNumber.trim()) {
      setMessage('请填写所有必填项')
      return
    }

    // 检查人设信息是否完整
    if (!userProfile.persona || !userProfile.keywords || !userProfile.vision) {
      setMessage('请先完善人设信息后再生成内容')
      // 3秒后自动跳转到人设页面
      setTimeout(() => {
        router.push('/profile')
      }, 3000)
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
          angle: selectedAngle,
          day_number: parseInt(dayNumber)
        })
      })

      if (!response.ok) {
        console.error('Response not ok:', response.status, response.statusText)

        // 特别处理504网关超时
        if (response.status === 504) {
          throw new Error('服务器响应超时，请稍后重试。如果问题持续存在，可能是Dify API响应缓慢。')
        }

        // 尝试获取错误详情
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || `请求失败 (${response.status})`)
        } catch (jsonError) {
          throw new Error(`请求失败 (${response.status}): ${response.statusText}`)
        }
      }

      let result
      try {
        result = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError)
        throw new Error('服务器返回了无效的数据格式，请重试')
      }
      console.log('API response:', result)

      // 处理API响应数据格式
      let mockData
      if (result.dify) {
        setMessage('✅ 内容生成成功 (Dify AI生成)！正在跳转到结果页面...')
      } else if (result.mock) {
        setMessage('⚠️ 当前使用模拟数据，Dify API调用失败或未配置')
      }

      // 直接使用API返回的结构化数据
      if (result.titles && result.bodies) {
        mockData = {
          titles: result.titles,
          bodies: result.bodies,
          hashtags: result.hashtags || [],
          visuals: result.visuals || { images: [], videos: [] }
        }
      } else {
        // 兜底使用模拟数据
        mockData = generateMockData()
        setMessage('⚠️ 响应格式错误，使用模拟数据')
      }

      // 保存数据和输入参数到localStorage
      const contentWithParams = {
        ...mockData,
        inputParams: {
          student_id: studentId,
          user_name: userName,
          user_input: userInput,
          angle: selectedAngle,
          day_number: parseInt(dayNumber),
          persona: userProfile.persona,
          keywords: userProfile.keywords,
          vision: userProfile.vision
        },
        dify: result.dify,
        mock: result.mock
      }
      localStorage.setItem('generatedContent', JSON.stringify(contentWithParams))

      // 设置生成的内容到当前页面显示
      setGeneratedContent(JSON.stringify(contentWithParams, null, 2))

      // 设置成功消息
      setMessage(`内容生成成功${result.dify ? ' (Dify AI生成)' : ' (模拟数据)'}！`)

    } catch (error) {
      setMessage(error instanceof Error ? error.message : '网络错误，请检查连接')
      console.error('Generate error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 如果未认证，显示加载状态（实际会自动跳转）
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-white/80">正在验证身份...</p>
        </div>
      </div>
    )
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
          {/* 显示已登录的用户信息 */}
          <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-400/30 rounded-lg">
            <div className="flex items-center">
              <span className="text-xl mr-3">👤</span>
              <div>
                <p className="text-white font-medium">
                  欢迎{userName || '学员'}
                </p>
                <p className="text-green-300 text-sm">
                  学号：{studentId}
                </p>
                <p className="text-green-300/70 text-xs mt-1">
                  已通过身份验证，可使用AI内容生成功能
                </p>
              </div>
            </div>
          </div>

          {/* 人设信息显示 */}
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <span className="text-xl mr-3">🎭</span>
                  <h3 className="text-white font-medium">当前人设信息</h3>
                </div>

                {userProfile.persona && userProfile.keywords && userProfile.vision ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-purple-300 font-medium">人设定位：</span>
                      <span className="text-white/80 ml-2">{userProfile.persona}</span>
                    </div>
                    <div>
                      <span className="text-purple-300 font-medium">关键词：</span>
                      <span className="text-white/80 ml-2">{userProfile.keywords}</span>
                    </div>
                    <div>
                      <span className="text-purple-300 font-medium">90天愿景：</span>
                      <span className="text-white/80 ml-2">{userProfile.vision}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-yellow-300 text-sm">
                    ⚠️ 尚未完善人设信息，请先设置人设后再生成内容
                  </div>
                )}
              </div>

              <button
                onClick={() => router.push('/profile')}
                className="ml-4 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg text-purple-300 hover:text-purple-200 transition-colors text-sm"
              >
                {userProfile.persona ? '修改人设' : '设置人设'}
              </button>
            </div>
          </div>

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

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              第几天打卡 <span className="text-pink-400 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="365"
                value={dayNumber}
                onChange={(e) => setDayNumber(e.target.value)}
                placeholder="请输入打卡天数，如：1、15、30等"
                className="w-full px-4 py-3 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300"
              />
              <div className="absolute right-3 top-3 text-white/40 text-sm">
                天
              </div>
            </div>
            <p className="text-white/50 text-xs mt-1">
              💡 提示：输入您当前的学习打卡天数，有助于AI生成更个性化的内容
            </p>
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>正在生成中，请耐心等待，不会超过1分钟...</span>
              </div>
            ) : (
              '生成内容'
            )}
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

      {generatedContent && (
        <Card title="生成结果" icon="✨" className="mb-8">
          <div className="space-y-6">
            {/* 解析并显示生成的内容 */}
            {(() => {
              try {
                const content = JSON.parse(generatedContent)
                return (
                  <div className="space-y-6">
                    {/* 标题选项 */}
                    {content.titles && content.titles.length > 0 && (
                      <div className="glass-effect p-6 rounded-lg border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">📝 标题选项</h3>
                        <div className="space-y-3">
                          {content.titles.map((title: any, index: number) => (
                            <div key={index} className="p-3 bg-white/5 rounded-lg">
                              <p className="text-white/90">{title.content || title}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 正文内容 */}
                    {content.bodies && content.bodies.length > 0 && (
                      <div className="glass-effect p-6 rounded-lg border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">📄 正文内容</h3>
                        <div className="space-y-4">
                          {content.bodies.map((body: any, index: number) => (
                            <div key={index} className="p-4 bg-white/5 rounded-lg">
                              <p className="text-white/90 whitespace-pre-wrap">{body.content || body}</p>
                              {body.style && (
                                <p className="text-white/60 text-sm mt-2">风格: {body.style}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 标签建议 */}
                    {content.hashtags && content.hashtags.length > 0 && (
                      <div className="glass-effect p-6 rounded-lg border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4"># 标签建议</h3>
                        <div className="flex flex-wrap gap-2">
                          {content.hashtags.map((tag: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(content, null, 2))
                          setMessage('内容已复制到剪贴板！')
                          setTimeout(() => setMessage(''), 2000)
                        }}
                      >
                        📋 复制全部内容
                      </Button>
                      <Button
                        onClick={() => {
                          localStorage.setItem('generatedContent', generatedContent)
                          router.push('/result')
                        }}
                      >
                        📄 查看详细结果
                      </Button>
                    </div>
                  </div>
                )
              } catch (error) {
                return (
                  <div className="glass-effect p-6 rounded-lg border border-white/10">
                    <pre className="whitespace-pre-wrap text-sm text-white/90 leading-relaxed">
                      {generatedContent}
                    </pre>
                  </div>
                )
              }
            })()}
          </div>
        </Card>
      )}
    </div>
  )
}
