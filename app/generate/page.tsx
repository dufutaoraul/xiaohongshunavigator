'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '../components/Card'
import Textarea from '../components/Textarea'
import Button from '../components/Button'
import GlobalUserMenu from '../components/GlobalUserMenu'
import DualCarousel from '../components/DualCarousel'
import { QRCodeModal } from '@/components/QRCodeModal'
import { ViewNoteButton } from '@/components/ViewNoteButton'

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

  // 新增搜索相关状态
  const [currentStep, setCurrentStep] = useState(1) // 1: 生成模板, 2: 生成关键词, 3: 搜索内容
  const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([])
  const [editableKeywords, setEditableKeywords] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [keywordLoading, setKeywordLoading] = useState(false)

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
      hashtags: ["AI学习", "创富营", "效率提升"].concat(extractedTags.length > 0 ? extractedTags : ["AI工具", "学习方法", "个人成长"]),
      visuals: {
        images: [
          { id: 1, suggestion: visualSuggestions || "根据内容主题制作相关配图，突出重点信息" }
        ],
        videos: [
          { id: 1, suggestion: "制作内容相关的短视频，增强表达效果" }
        ]
      }
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

  // 生成关键词
  const handleGenerateKeywords = async () => {
    if (!generatedContent) {
      setMessage('请先生成内容模板')
      return
    }

    setKeywordLoading(true)
    try {
      const response = await fetch('/api/keywords/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: studentId,
          theme_text: userInput
        })
      })

      if (!response.ok) {
        throw new Error('关键词生成失败')
      }

      const result = await response.json()
      if (result.success) {
        setGeneratedKeywords(result.keywords)
        setEditableKeywords([...result.keywords])
        setCurrentStep(2)
        setMessage('关键词生成成功！您可以编辑关键词后进行搜索')
      } else {
        throw new Error(result.error || '关键词生成失败')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '关键词生成失败')
    } finally {
      setKeywordLoading(false)
    }
  }

  // 搜索相关内容
  const handleSearchContent = async () => {
    if (editableKeywords.length === 0) {
      setMessage('请先生成关键词')
      return
    }

    setSearchLoading(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywords: editableKeywords,
          page: 1,
          page_size: 6,
          sort: 'like',
          student_id: studentId
        })
      })

      if (!response.ok) {
        throw new Error('搜索失败')
      }

      const result = await response.json()
      if (result.success) {
        setSearchResults(result.data.notes || [])
        setCurrentStep(3)
        setMessage(`搜索成功！找到 ${result.data.notes?.length || 0} 条相关内容`)
      } else {
        throw new Error(result.error || '搜索失败')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '搜索失败')
    } finally {
      setSearchLoading(false)
    }
  }

  // 编辑关键词
  const handleKeywordEdit = (index: number, newValue: string) => {
    const newKeywords = [...editableKeywords]
    newKeywords[index] = newValue
    setEditableKeywords(newKeywords)
  }

  // 删除关键词
  const handleKeywordDelete = (index: number) => {
    const newKeywords = editableKeywords.filter((_, i) => i !== index)
    setEditableKeywords(newKeywords)
  }

  // 添加关键词
  const handleKeywordAdd = () => {
    setEditableKeywords([...editableKeywords, ''])
  }

  return (
    <div className="min-h-screen relative">
      {/* 全局用户菜单 - 左上角 */}
      <GlobalUserMenu className="absolute top-6 left-6 z-50" />

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center fade-in-up">
        <h1 className="text-4xl font-bold gradient-text mb-6">🤖 AI灵感内容引擎</h1>
        <p className="text-xl text-white/80">
          一站式创作工具：生成模板 → 智能关键词 → 搜索爆款 🚀
        </p>
      </div>

      {/* 步骤指示器 */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentStep >= 1 ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-gray-500/20 border border-gray-400/30'}`}>
            <span className="text-2xl">📝</span>
            <span className="text-white font-medium">生成模板</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-400/30"></div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentStep >= 2 ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-gray-500/20 border border-gray-400/30'}`}>
            <span className="text-2xl">🔑</span>
            <span className="text-white font-medium">生成关键词</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-400/30"></div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentStep >= 3 ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-gray-500/20 border border-gray-400/30'}`}>
            <span className="text-2xl">🔍</span>
            <span className="text-white font-medium">搜索爆款</span>
          </div>
        </div>
      </div>

      <Card title="内容生成设置" icon="⚡" className="mb-8">
        <div className="space-y-6">
          {/* 显示已登录的用户信息 */}
          <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-400/30 rounded-lg">
            <div className="flex items-center justify-between">
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

      {(generatedContent || visualSuggestions) && (
        <>
          <Card title="生成的文案内容" icon="✨" className="mb-8">
            <div className="glass-effect p-6 rounded-lg border border-white/10">
              <pre className="whitespace-pre-wrap text-sm text-white/90 leading-relaxed">
                {generatedContent || '✨ 内容生成中，请稍候...'}
              </pre>
            </div>
            <div className="flex space-x-4 mt-4">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(generatedContent)}>
                📋 复制文案
              </Button>
              <Button onClick={handleGenerateKeywords} disabled={keywordLoading}>
                {keywordLoading ? '生成中...' : '🔑 生成关键词'}
              </Button>
            </div>
          </Card>

          <Card title="配图/视频建议" icon="🎨" className="mb-8">
            <div className="glass-effect p-6 rounded-lg border border-white/10">
              <pre className="whitespace-pre-wrap text-sm text-white/90 leading-relaxed">
                {visualSuggestions || '🎨 视觉建议生成中，请稍候...'}
              </pre>
            </div>
          </Card>
        </>
      )}

      {/* 关键词编辑区域 */}
      {currentStep >= 2 && (
        <Card title="智能关键词" icon="🔑" className="mb-8">
          <div className="space-y-4">
            <p className="text-white/70 text-sm">
              基于您的内容和人设生成的关键词，您可以编辑后进行搜索
            </p>
            <div className="flex flex-wrap gap-2">
              {editableKeywords.map((keyword, index) => (
                <div key={index} className="flex items-center space-x-2 bg-blue-500/20 border border-blue-400/30 rounded-lg px-3 py-2">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => handleKeywordEdit(index, e.target.value)}
                    className="bg-transparent text-white text-sm border-none outline-none min-w-0 flex-1"
                    placeholder="输入关键词"
                  />
                  <button
                    onClick={() => handleKeywordDelete(index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={handleKeywordAdd}
                className="flex items-center space-x-2 bg-gray-500/20 border border-gray-400/30 rounded-lg px-3 py-2 text-white/70 hover:text-white hover:bg-gray-500/30 transition-colors"
              >
                <span>+</span>
                <span className="text-sm">添加关键词</span>
              </button>
            </div>
            <Button onClick={handleSearchContent} disabled={searchLoading || editableKeywords.length === 0}>
              {searchLoading ? '搜索中...' : '🔍 搜索相关爆款'}
            </Button>
          </div>
        </Card>
      )}

      {/* 搜索结果区域 */}
      {currentStep >= 3 && searchResults.length > 0 && (
        <Card title="相关爆款内容" icon="🔥" className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((note, index) => (
              <div key={note.note_id || index} className="glass-effect p-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                <div className="space-y-3">
                  <h3 className="text-white font-medium text-sm line-clamp-2">
                    {note.title || '无标题'}
                  </h3>
                  <div className="flex items-center space-x-4 text-xs text-white/60">
                    <span>👤 {note.nickname || note.author || '匿名'}</span>
                    <span>❤️ {note.liked_count || 0}</span>
                    <span>💬 {note.comment_count || 0}</span>
                  </div>
                  <div className="flex space-x-2">
                    <ViewNoteButton
                      note_id={note.note_id}
                      url={note.url}
                      title={note.title}
                      className="flex-1 text-xs py-2"
                    >
                      查看原文
                    </ViewNoteButton>
                    <button
                      onClick={() => navigator.clipboard.writeText(note.url)}
                      className="px-3 py-2 text-xs bg-gray-500/20 hover:bg-gray-500/30 text-white rounded-md transition-colors"
                    >
                      复制链接
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 轮播区域 */}
      <div className="mt-12">
        <DualCarousel />
      </div>
      </div>
    </div>
  )
}