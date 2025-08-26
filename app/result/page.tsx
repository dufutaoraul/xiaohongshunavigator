'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Card from '../components/Card'
import Button from '../components/Button'
// import { QRCodeModal } from '../../components/QRCodeModal'
// import { ViewNoteButton } from '../../components/ViewNoteButton'

interface GeneratedContent {
  titles: Array<{ id?: number, content: string }>
  bodies: Array<{ id?: number, content: string, style: string }>
  hashtags: string[] | {
    fixed: string[]
    generated: string[]
  }
  visuals: {
    images: Array<{ id?: number, suggestion: string }>
    videos: Array<{ id?: number, suggestion: string }>
  }
  dify?: boolean  // 标识是否来自Dify
  mock?: boolean  // 标识是否为模拟数据
}

function ResultPageContent() {
  const [data, setData] = useState<GeneratedContent | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [inputParams, setInputParams] = useState<any>(null)

  // 新增关键词和搜索相关状态
  const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([])
  const [selectedKeyword, setSelectedKeyword] = useState<string>('')
  const [customKeyword, setCustomKeyword] = useState<string>('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [keywordLoading, setKeywordLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showKeywords, setShowKeywords] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [userCookie, setUserCookie] = useState('')
  const [showCookieModal, setShowCookieModal] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  
  // 必选标签
  const requiredTags = ['#爱学AI社区', '#爱学AI创富营', '#爱学AI90天打卡陪跑', '#爱学AI深潜计划']

  useEffect(() => {
    // 获取用户信息
    const userSession = localStorage.getItem('userSession')
    if (userSession) {
      try {
        const session = JSON.parse(userSession)
        if (session.isAuthenticated) {
          setStudentId(session.student_id)
        }
      } catch {
        // 忽略解析错误
      }
    }

    // 从URL参数中获取数据或从localStorage中读取
    const dataParam = searchParams.get('data')
    if (dataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataParam))
        setData(parsedData)
        if (parsedData.inputParams) {
          setInputParams(parsedData.inputParams)
        }
      } catch (error) {
        console.error('Failed to parse data:', error)
      }
    } else {
      // 如果URL中没有数据，从localStorage读取
      const storedData = localStorage.getItem('generatedContent')
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData)
        setData(parsedData)
        if (parsedData.inputParams) {
          setInputParams(parsedData.inputParams)
        }
        } catch (error) {
          console.error('Failed to parse stored data:', error)
        }
      }
    }
  }, [searchParams])
  
  // 当数据加载后，初始化标签选择状态
  useEffect(() => {
    if (data) {
      let allTags: string[] = []
      
      if (Array.isArray(data.hashtags)) {
        allTags = data.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`)
      } else {
        const fixed = data.hashtags.fixed.map(tag => tag.startsWith('#') ? tag : `#${tag}`)
        const generated = data.hashtags.generated.map(tag => tag.startsWith('#') ? tag : `#${tag}`)
        allTags = [...fixed, ...generated]
      }
      
      // 默认选中必选标签
      const defaultSelected = allTags.filter(tag => 
        requiredTags.some(reqTag => tag.includes(reqTag.replace('#', '')) || reqTag.includes(tag.replace('#', '')))
      )
      
      // 如果没有匹配到必选标签，就直接添加必选标签
      const finalSelected = [...requiredTags]
      allTags.forEach(tag => {
        if (!finalSelected.some(selected => selected.includes(tag.replace('#', '')) || tag.includes(selected.replace('#', '')))) {
          // 其他标签默认不选中
        }
      })
      
      setSelectedTags(finalSelected)
    }
  }, [data])

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(`${type}已复制！`)
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopyFeedback('复制失败，请重试')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }

  const toggleTag = (tag: string) => {
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`
    
    // 必选标签不能取消选择
    if (requiredTags.includes(formattedTag)) {
      return
    }
    
    setSelectedTags(prev => {
      if (prev.includes(formattedTag)) {
        return prev.filter(t => t !== formattedTag)
      } else {
        return [...prev, formattedTag]
      }
    })
  }
  
  const copySelectedTags = async () => {
    if (selectedTags.length === 0) return
    const tagText = selectedTags.join(' ')
    await copyToClipboard(tagText, '选中标签')
  }
  
  const getAllTags = () => {
    if (!data) return []
    
    let allTags: string[] = []
    if (Array.isArray(data.hashtags)) {
      allTags = data.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`)
    } else {
      const fixed = data.hashtags.fixed.map(tag => tag.startsWith('#') ? tag : `#${tag}`)
      const generated = data.hashtags.generated.map(tag => tag.startsWith('#') ? tag : `#${tag}`)
      allTags = [...fixed, ...generated]
    }
    
    // 合并必选标签和现有标签，去重
    const combinedTags = [...requiredTags, ...allTags]
    const uniqueTags = combinedTags.filter((tag, index) => combinedTags.indexOf(tag) === index)
    return uniqueTags
  }

  const handleRegenerate = () => {
    router.push('/generate')
  }

  const handleBackHome = () => {
    router.push('/')
  }

  // 生成关键词
  const handleGenerateKeywords = async () => {
    if (!inputParams?.user_input) {
      alert('无法获取生成内容的主题信息')
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
          theme_text: inputParams.user_input
        })
      })

      if (!response.ok) {
        throw new Error('关键词生成失败')
      }

      const result = await response.json()
      if (result.success) {
        setGeneratedKeywords(result.keywords)
        setShowKeywords(true)
        // 默认选择第一个关键词
        if (result.keywords.length > 0) {
          setSelectedKeyword(result.keywords[0])
        }
      } else {
        throw new Error(result.error || '关键词生成失败')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '关键词生成失败')
    } finally {
      setKeywordLoading(false)
    }
  }

  // 检查Cookie
  const checkCookie = () => {
    const savedCookie = localStorage.getItem('xhs_cookie')
    if (savedCookie) {
      setUserCookie(savedCookie)
      return true
    }
    return false
  }

  // 搜索相关内容
  const handleSearchContent = async () => {
    const finalKeyword = selectedKeyword || customKeyword
    if (!finalKeyword.trim()) {
      alert('请选择一个关键词或输入自定义关键词')
      return
    }

    // 检查Cookie
    if (!checkCookie()) {
      setShowCookieModal(true)
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
          keywords: [finalKeyword],
          page: 1,
          page_size: 10,
          sort: 'like',
          student_id: studentId,
          cookie: userCookie
        })
      })

      if (!response.ok) {
        throw new Error('搜索失败')
      }

      const result = await response.json()
      if (result.success) {
        setSearchResults(result.data.notes || [])
        setShowSearchResults(true)
      } else {
        throw new Error(result.error || '搜索失败')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '搜索失败')
    } finally {
      setSearchLoading(false)
    }
  }

  // 保存Cookie
  const handleSaveCookie = (cookie: string) => {
    localStorage.setItem('xhs_cookie', cookie)
    setUserCookie(cookie)
    setShowCookieModal(false)
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-white/80">正在加载生成结果...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            ✨ AI生成结果
          </h1>
          <p className="text-white/70">
            您的专属小红书内容已生成完毕，请查看并使用
          </p>
          
          {/* 数据来源标识 */}
          <div className="mt-4 flex justify-center">
            {data?.dify && (
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 px-4 py-2 rounded-full">
                <span className="text-green-300 text-sm font-medium flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  ✅ Dify AI 智能生成
                </span>
              </div>
            )}
            {data?.mock && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 px-4 py-2 rounded-full">
                <span className="text-yellow-300 text-sm font-medium flex items-center">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                  ⚠️ 使用模拟数据 (Dify未配置)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 本次生成参数模块 */}
        {inputParams && (
          <section className="mb-8">
            <div className="glass-effect p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="text-2xl mr-2">📝</span>
                本次生成参数
                <span className="ml-2 text-xs text-white/40">灵感回顾</span>
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 用户信息 */}
                <div className="space-y-4">
                  <div className="bg-black/20 border border-white/10 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2 flex items-center">
                      <span className="mr-2">🧑‍💼</span>
                      学员信息
                    </h4>
                    <div className="text-white/70 text-sm space-y-1">
                      <p><strong>学号：</strong>{inputParams.student_id}</p>
                      {inputParams.user_name && <p><strong>姓名：</strong>{inputParams.user_name}</p>}
                    </div>
                  </div>
                  
                  <div className="bg-black/20 border border-white/10 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2 flex items-center">
                      <span className="mr-2">🎯</span>
                      人设定位
                    </h4>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {inputParams.persona || '暂未设置'}
                    </p>
                  </div>
                  
                  <div className="bg-black/20 border border-white/10 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2 flex items-center">
                      <span className="mr-2">📝</span>
                      内容关键词
                    </h4>
                    <p className="text-white/80 text-sm">
                      {inputParams.keywords || '暂未设置'}
                    </p>
                  </div>
                </div>
                
                {/* 生成参数 */}
                <div className="space-y-4">
                  <div className="bg-black/20 border border-white/10 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2 flex items-center">
                      <span className="mr-2">💡</span>
                      今日主题/灵感
                    </h4>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {inputParams.user_input}
                    </p>
                  </div>
                  
                  <div className="bg-black/20 border border-white/10 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2 flex items-center">
                      <span className="mr-2">🔄</span>
                      分享角度
                    </h4>
                    <p className="text-white/80 text-sm">
                      {inputParams.angle}
                    </p>
                  </div>
                  
                  <div className="bg-black/20 border border-white/10 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2 flex items-center">
                      <span className="mr-2">📅</span>
                      打卡天数
                    </h4>
                    <p className="text-white/80 text-sm">
                      第 {inputParams.day_number} 天
                    </p>
                  </div>
                  
                  <div className="bg-black/20 border border-white/10 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2 flex items-center">
                      <span className="mr-2">🎆</span>
                      90天愿景
                    </h4>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {inputParams.vision || '暂未设置'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 复制反馈提示 */}
        {copyFeedback && (
          <div className="fixed top-20 right-4 bg-green-500/90 text-white px-4 py-2 rounded-lg z-50 animate-pulse">
            {copyFeedback}
          </div>
        )}

        {/* 标题区 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">📝</span>
            小红书标题
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {data.titles.map((title, index) => (
              <div key={title.id || index} className="glass-effect p-4 rounded-lg hover:bg-white/5 transition-all duration-300">
                {/* 标题编号 */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {title.id && (
                      <div className="text-xs text-white/40 mb-2">
                        标题 #{title.id}
                      </div>
                    )}
                    <p className="text-white/90 leading-relaxed text-sm">
                      {title.content}
                    </p>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(title.content, '标题')}
                    className="ml-3 px-3 py-1 text-xs whitespace-nowrap hover:scale-105 transition-transform"
                  >
                    📋
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 正文区 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">📄</span>
            小红书正文
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.bodies.map((body, index) => (
              <div key={body.id || index} className="glass-effect p-6 rounded-lg relative hover:bg-white/5 transition-all duration-300">
                {/* 样式标签和ID */}
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {body.style}
                  </span>
                  {body.id && (
                    <span className="text-xs text-white/40">
                      #{body.id}
                    </span>
                  )}
                </div>
                
                {/* 正文内容 */}
                <div className="mb-6">
                  <p className="text-white/90 leading-relaxed whitespace-pre-line text-sm">
                    {body.content}
                  </p>
                </div>
                
                {/* 复制按钮 */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => copyToClipboard(body.content, '正文')}
                    className="px-4 py-2 text-sm hover:scale-105 transition-transform"
                  >
                    📋 复制
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 标签区 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="text-2xl mr-2">🏷️</span>
              推荐标签
              <span className="ml-2 text-xs text-white/40">({selectedTags.length}已选)</span>
            </h2>
            <Button onClick={copySelectedTags} className="px-4 py-2 hover:scale-105 transition-transform">
              📋 复制选中标签
            </Button>
          </div>
          
          <div className="glass-effect p-6 rounded-lg">
            {/* 必选标签提示 */}
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
              <p className="text-blue-300 text-sm flex items-center">
                <span className="mr-2">⭐</span>
                以下标签为必选项，已默认选中且无法取消：
              </p>
            </div>
            
            {/* 标签列表 */}
            <div className="flex flex-wrap gap-3">
              {getAllTags().map((tag, index) => {
                const isSelected = selectedTags.includes(tag)
                const isRequired = requiredTags.includes(tag)
                
                return (
                  <button
                    key={`${tag}-${index}`}
                    onClick={() => toggleTag(tag)}
                    disabled={isRequired}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
                      isSelected
                        ? isRequired
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg shadow-green-500/25 hover:scale-105 cursor-pointer'
                        : 'bg-white/10 text-white/70 border border-white/30 hover:border-white/50 hover:bg-white/15 hover:scale-105 cursor-pointer'
                    }`}
                  >
                    {tag}
                    {isRequired && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">⭐</span>
                      </span>
                    )}
                    {isSelected && !isRequired && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            
            {/* 使用说明 */}
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-white font-medium mb-2 flex items-center">
                <span className="mr-2">💡</span>
                使用说明
              </h4>
              <ul className="text-white/60 text-xs space-y-1">
                <li>• 蓝色带星标签为必选项，已默认选中</li>
                <li>• 绿色带勾标签为您已选中的可选标签</li>
                <li>• 灰色标签为可选项，点击即可选中/取消</li>
                <li>• 点击右上角按钮复制所有选中的标签</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 视觉建议区 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">🎨</span>
            视觉建议
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 图片建议 */}
            <div className="glass-effect p-6 rounded-lg hover:bg-white/5 transition-all duration-300">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="text-xl mr-2">📸</span>
                图片建议
                <span className="ml-2 text-xs text-white/40">({data.visuals.images.length}条)</span>
              </h3>
              <div className="space-y-3">
                {data.visuals.images.map((image, index) => (
                  <div key={image.id || index} className="bg-black/20 border border-white/10 p-4 rounded-lg hover:border-white/20 transition-all duration-300 relative group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {image.id && (
                          <div className="text-xs text-white/40 mb-1">
                            图片建议 #{image.id}
                          </div>
                        )}
                        <p className="text-white/80 text-sm leading-relaxed">
                          {image.suggestion}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(image.suggestion, '图片建议')}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white text-xs"
                      >
                        📋
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 w-1 h-1 bg-pink-400 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* 视频建议 */}
            <div className="glass-effect p-6 rounded-lg hover:bg-white/5 transition-all duration-300">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="text-xl mr-2">🎬</span>
                视频建议
                <span className="ml-2 text-xs text-white/40">({data.visuals.videos.length}条)</span>
              </h3>
              <div className="space-y-3">
                {data.visuals.videos.map((video, index) => (
                  <div key={video.id || index} className="bg-black/20 border border-white/10 p-4 rounded-lg hover:border-white/20 transition-all duration-300 relative group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {video.id && (
                          <div className="text-xs text-white/40 mb-1">
                            视频建议 #{video.id}
                          </div>
                        )}
                        <p className="text-white/80 text-sm leading-relaxed">
                          {video.suggestion}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(video.suggestion, '视频建议')}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white text-xs"
                      >
                        📋
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 w-1 h-1 bg-cyan-400 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 关键词生成和搜索功能 */}
        <section className="mb-12">
          <div className="glass-effect p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="text-2xl mr-2">🔍</span>
              智能搜索相关爆款
              <span className="ml-2 text-xs text-white/40">基于生成内容</span>
            </h2>

            {/* 关键词生成按钮 */}
            <div className="mb-6">
              <Button
                onClick={handleGenerateKeywords}
                disabled={keywordLoading || !studentId}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {keywordLoading ? '生成中...' : '🔑 生成搜索关键词'}
              </Button>
              {!studentId && (
                <p className="text-yellow-300 text-sm mt-2">请先登录后使用此功能</p>
              )}
            </div>

            {/* 关键词选择区域 */}
            {showKeywords && (
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">选择搜索关键词</h3>
                <p className="text-white/60 text-sm mb-4">
                  由于搜索功能一次只能搜一个词，请从推荐的AI关键词中选择一个，或自己手动输入：
                </p>

                {/* 推荐关键词选择 */}
                <div className="mb-4">
                  <h4 className="text-white/80 text-sm mb-2">推荐的AI关键词：</h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedKeywords.map((keyword, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedKeyword(keyword)
                          setCustomKeyword('')
                        }}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedKeyword === keyword
                            ? 'bg-blue-500 text-white border border-blue-400'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-400/30 hover:bg-blue-500/30'
                        }`}
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 自定义关键词输入 */}
                <div className="mb-4">
                  <h4 className="text-white/80 text-sm mb-2">或输入自定义关键词：</h4>
                  <input
                    type="text"
                    value={customKeyword}
                    onChange={(e) => {
                      setCustomKeyword(e.target.value)
                      if (e.target.value) {
                        setSelectedKeyword('')
                      }
                    }}
                    placeholder="输入你想搜索的关键词..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                  />
                </div>

                {/* 当前选择显示 */}
                {(selectedKeyword || customKeyword) && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
                    <p className="text-green-300 text-sm">
                      将搜索关键词：<span className="font-medium">{selectedKeyword || customKeyword}</span>
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleSearchContent}
                  disabled={searchLoading || (!selectedKeyword && !customKeyword.trim())}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {searchLoading ? '搜索中...' : '🔍 确认搜索'}
                </Button>
              </div>
            )}

            {/* 搜索结果区域 */}
            {showSearchResults && searchResults.length > 0 && (
              <div>
                <h3 className="text-white font-medium mb-4">相关爆款内容 ({searchResults.length}条)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((note, index) => (
                    <div key={note.note_id || index} className="bg-black/20 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors">
                      <div className="space-y-3">
                        <h4 className="text-white font-medium text-sm line-clamp-2">
                          {note.title || '无标题'}
                        </h4>
                        <div className="flex items-center space-x-4 text-xs text-white/60">
                          <span>👤 {note.nickname || note.author || '匿名'}</span>
                          <span>❤️ {note.liked_count || 0}</span>
                          <span>💬 {note.comment_count || 0}</span>
                        </div>
                        <div className="flex space-x-2">
                          <a
                            href={note.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-xs py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-md transition-colors text-center"
                          >
                            查看原文
                          </a>
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
              </div>
            )}
          </div>
        </section>

        {/* 导航按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <Button
            onClick={handleBackHome}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg font-semibold min-w-[200px]"
          >
            🏠 返回主页
          </Button>
          <Button
            onClick={handleRegenerate}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-lg font-semibold min-w-[200px]"
          >
            🔄 不满意，重新生成
          </Button>
        </div>

        {/* Cookie设置模态框 */}
        {showCookieModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-md mx-4">
              <div className="text-center">
                <h3 className="text-white font-medium text-lg mb-4">
                  🍪 设置小红书Cookie
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  为了获取真实的小红书数据，需要设置您的小红书Cookie。请按以下步骤操作：
                </p>
                <div className="text-left text-white/70 text-xs mb-4 space-y-2">
                  <p>1. 打开小红书网页版并登录</p>
                  <p>2. 按F12打开开发者工具</p>
                  <p>3. 在Network标签页中找到请求</p>
                  <p>4. 复制Cookie值并粘贴到下方</p>
                </div>
                <textarea
                  placeholder="请粘贴您的小红书Cookie..."
                  className="w-full h-24 px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 text-xs resize-none focus:border-blue-400 focus:outline-none"
                  onChange={(e) => setUserCookie(e.target.value)}
                />
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={() => handleSaveCookie(userCookie)}
                    disabled={!userCookie.trim()}
                    className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    保存并搜索
                  </button>
                  <button
                    onClick={() => setShowCookieModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-white rounded-lg transition-colors text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-white/80">正在加载页面...</p>
        </div>
      </div>
    }>
      <ResultPageContent />
    </Suspense>
  )
}