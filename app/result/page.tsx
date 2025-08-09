'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Card from '../components/Card'
import Button from '../components/Button'

interface GeneratedContent {
  titles: Array<{ content: string }>
  bodies: Array<{ content: string, style: string }>
  hashtags: {
    fixed: string[]
    generated: string[]
  }
  visuals: {
    images: Array<{ suggestion: string }>
    videos: Array<{ suggestion: string }>
  }
}

export default function ResultPage() {
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
    const allTags = [...data.hashtags.fixed, ...data.hashtags.generated]
    const tagText = allTags.map(tag => `#${tag}`).join(' ')
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
              <div key={index} className="glass-effect p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <p className="text-white/90 flex-1 leading-relaxed text-sm">
                    {title.content}
                  </p>
                  <Button
                    onClick={() => copyToClipboard(title.content, '标题')}
                    className="ml-3 px-3 py-1 text-xs whitespace-nowrap"
                  >
                    复制
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
              <div key={index} className="glass-effect p-6 rounded-lg relative">
                {/* 样式标签 */}
                <div className="absolute top-3 left-3">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {body.style}
                  </span>
                </div>
                
                {/* 正文内容 */}
                <div className="mt-8 mb-4">
                  <p className="text-white/90 leading-relaxed whitespace-pre-line text-sm">
                    {body.content}
                  </p>
                </div>
                
                {/* 复制按钮 */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => copyToClipboard(body.content, '正文')}
                    className="px-4 py-2 text-sm"
                  >
                    复制
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
            <Button onClick={copyAllTags} className="px-4 py-2">
              一键复制所有标签
            </Button>
          </div>
          <div className="glass-effect p-6 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {[...data.hashtags.fixed, ...data.hashtags.generated].map((tag, index) => (
                <span
                  key={index}
                  className="bg-gradient-to-r from-pink-400 to-red-400 text-white px-3 py-1 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => copyToClipboard(`#${tag}`, '标签')}
                >
                  #{tag}
                </span>
              ))}
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
            <div className="glass-effect p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="text-xl mr-2">📸</span>
                图片建议
              </h3>
              <div className="space-y-3">
                {data.visuals.images.map((image, index) => (
                  <div key={index} className="bg-black/20 border border-white/10 p-4 rounded-lg">
                    <p className="text-white/80 text-sm leading-relaxed">
                      {image.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 视频建议 */}
            <div className="glass-effect p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="text-xl mr-2">🎬</span>
                视频建议
              </h3>
              <div className="space-y-3">
                {data.visuals.videos.map((video, index) => (
                  <div key={index} className="bg-black/20 border border-white/10 p-4 rounded-lg">
                    <p className="text-white/80 text-sm leading-relaxed">
                      {video.suggestion}
                    </p>
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