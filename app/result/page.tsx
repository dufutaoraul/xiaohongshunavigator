'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Card from '../components/Card'
import Button from '../components/Button'

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
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // 从URL参数中获取数据或从localStorage中读取
    const dataParam = searchParams.get('data')
    if (dataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataParam))
        setData(parsedData)
      } catch (error) {
        console.error('Failed to parse data:', error)
      }
    } else {
      // 如果URL中没有数据，从localStorage读取
      const storedData = localStorage.getItem('generatedContent')
      if (storedData) {
        try {
          setData(JSON.parse(storedData))
        } catch (error) {
          console.error('Failed to parse stored data:', error)
        }
      }
    }
  }, [searchParams])

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

  const copyAllTags = async () => {
    if (!data) return
    let allTags: string[] = []
    
    if (Array.isArray(data.hashtags)) {
      // 新格式：直接是字符串数组
      allTags = data.hashtags
    } else {
      // 旧格式：有fixed和generated分组
      allTags = [...data.hashtags.fixed, ...data.hashtags.generated]
    }
    
    const tagText = allTags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')
    await copyToClipboard(tagText, '所有标签')
  }

  const handleRegenerate = () => {
    router.push('/generate')
  }

  const handleBackHome = () => {
    router.push('/')
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
            {(!data?.dify && !data?.mock) && (
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 px-4 py-2 rounded-full">
                <span className="text-purple-300 text-sm font-medium flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                  🔧 开发测试数据
                </span>
              </div>
            )}
          </div>
        </div>

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
                
                {/* 统计信息 */}
                <div className="flex items-center justify-between text-xs text-white/40 mb-4">
                  <span>{body.content.length} 字符</span>
                  <span>{body.content.split('\n').length} 行</span>
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
            </h2>
            <Button onClick={copyAllTags} className="px-4 py-2 hover:scale-105 transition-transform">
              📋 一键复制所有标签
            </Button>
          </div>
          
          {Array.isArray(data.hashtags) ? (
            // 新格式：单一数组
            <div className="glass-effect p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="w-3 h-3 bg-gradient-to-r from-blue-400 to-pink-400 rounded-full mr-2"></span>
                AI推荐标签
                <span className="ml-2 text-xs text-white/40">({data.hashtags.length})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-blue-400 to-pink-400 text-white px-3 py-1 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                    onClick={() => copyToClipboard(tag.startsWith('#') ? tag : `#${tag}`, '标签')}
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            // 旧格式：分组显示
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 固定标签 */}
              <div className="glass-effect p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                  核心标签
                  <span className="ml-2 text-xs text-white/40">({data.hashtags.fixed.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.hashtags.fixed.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                      onClick={() => copyToClipboard(`#${tag}`, '标签')}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 生成标签 */}
              <div className="glass-effect p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-3 h-3 bg-pink-400 rounded-full mr-2"></span>
                  AI生成标签
                  <span className="ml-2 text-xs text-white/40">({data.hashtags.generated.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.hashtags.generated.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-pink-400 to-red-400 text-white px-3 py-1 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                      onClick={() => copyToClipboard(`#${tag}`, '标签')}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* 使用提示 */}
          <div className="mt-4 text-center">
            <p className="text-white/50 text-xs">
              💡 点击任意标签复制单个标签，或使用上方按钮复制所有标签
            </p>
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