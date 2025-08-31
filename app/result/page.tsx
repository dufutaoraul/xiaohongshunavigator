'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '../components/Card'
import Button from '../components/Button'

interface GeneratedContent {
  titles: Array<{ id: number; content: string }>
  bodies: Array<{ id: number; content: string; style: string }>
  hashtags: string[]
  visuals: {
    images: Array<{ id: number; suggestion: string }>
    videos: Array<{ id: number; suggestion: string }>
  }
  inputParams?: {
    student_id: string
    user_name: string
    user_input: string
    angle: string
    day_number: number
    persona: string
    keywords: string
    vision: string
  }
  dify?: boolean
  mock?: boolean
}

export default function ResultPage() {
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [selectedTitle, setSelectedTitle] = useState<number>(0)
  const [selectedBody, setSelectedBody] = useState<number>(0)
  const [copyMessage, setCopyMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const savedContent = localStorage.getItem('generatedContent')
    if (savedContent) {
      try {
        const parsedContent = JSON.parse(savedContent)
        setContent(parsedContent)
      } catch (error) {
        console.error('Failed to parse saved content:', error)
        router.push('/generate')
      }
    } else {
      router.push('/generate')
    }
  }, [router])

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyMessage(`${type}已复制到剪贴板！`)
      setTimeout(() => setCopyMessage(''), 3000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopyMessage('复制失败，请手动选择文本复制')
      setTimeout(() => setCopyMessage(''), 3000)
    }
  }

  const generateFullContent = () => {
    if (!content) return ''
    
    const selectedTitleContent = content.titles[selectedTitle]?.content || ''
    const selectedBodyContent = content.bodies[selectedBody]?.content || ''
    const hashtagsText = content.hashtags.join(' ')
    
    return `${selectedTitleContent}

${selectedBodyContent}

${hashtagsText}`
  }

  const copyFullContent = () => {
    const fullContent = generateFullContent()
    copyToClipboard(fullContent, '完整内容')
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-white/80">正在加载生成结果...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center fade-in-up">
        <h1 className="text-4xl font-bold gradient-text mb-6">✨ 内容生成结果</h1>
        <p className="text-xl text-white/80">
          {content.dify ? '🤖 AI智能生成' : '📝 模拟数据'} | 选择你喜欢的标题和正文组合
        </p>
        
        {/* 显示输入参数信息 */}
        {content.inputParams && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-lg max-w-2xl mx-auto">
            <div className="text-sm text-white/70 space-y-1">
              <p><span className="text-blue-300">用户：</span>{content.inputParams.user_name} ({content.inputParams.student_id})</p>
              <p><span className="text-blue-300">主题：</span>{content.inputParams.user_input}</p>
              <p><span className="text-blue-300">角度：</span>{content.inputParams.angle} | <span className="text-blue-300">第{content.inputParams.day_number}天</span></p>
            </div>
          </div>
        )}
      </div>

      {/* 复制成功提示 */}
      {copyMessage && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-green-500/90 text-white rounded-lg shadow-lg animate-pulse">
          {copyMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 标题选择 */}
        <Card title="📝 选择标题" icon="🎯">
          <div className="space-y-3">
            {content.titles.map((title, index) => (
              <div
                key={title.id}
                onClick={() => setSelectedTitle(index)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                  selectedTitle === index
                    ? 'bg-gradient-to-r from-purple-600/20 to-pink-500/20 border-purple-400 shadow-lg shadow-purple-500/25'
                    : 'glass-effect border-white/20 hover:border-purple-400/50 hover:bg-white/5'
                }`}
              >
                <p className="text-white text-sm leading-relaxed">{title.content}</p>
                {selectedTitle === index && (
                  <div className="mt-3 flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(title.content, '标题')}
                      className="text-xs py-1 px-3"
                    >
                      📋 复制
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* 正文选择 */}
        <Card title="📄 选择正文" icon="✍️">
          <div className="space-y-3">
            {content.bodies.map((body, index) => (
              <div
                key={body.id}
                onClick={() => setSelectedBody(index)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                  selectedBody === index
                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border-blue-400 shadow-lg shadow-blue-500/25'
                    : 'glass-effect border-white/20 hover:border-blue-400/50 hover:bg-white/5'
                }`}
              >
                <div className="mb-2">
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                    {body.style}
                  </span>
                </div>
                <p className="text-white text-sm leading-relaxed whitespace-pre-line">
                  {body.content.length > 200 ? body.content.substring(0, 200) + '...' : body.content}
                </p>
                {selectedBody === index && (
                  <div className="mt-3 flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(body.content, '正文')}
                      className="text-xs py-1 px-3"
                    >
                      📋 复制
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 完整内容预览 */}
      <Card title="📋 完整内容预览" icon="👀" className="mt-8">
        <div className="glass-effect p-6 rounded-lg border border-white/10">
          <pre className="whitespace-pre-line text-sm text-white/90 leading-relaxed">
            {generateFullContent()}
          </pre>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={copyFullContent} className="flex-1 min-w-[200px]">
            📋 复制完整内容
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/generate')}
            className="flex-1 min-w-[200px]"
          >
            🔄 重新生成
          </Button>
        </div>
      </Card>

      {/* 标签建议 */}
      <Card title="🏷️ 推荐标签" icon="🔖" className="mt-8">
        <div className="flex flex-wrap gap-2">
          {content.hashtags.map((hashtag, index) => (
            <span
              key={index}
              onClick={() => copyToClipboard(hashtag, '标签')}
              className="px-3 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-400/30 rounded-full text-pink-300 text-sm cursor-pointer hover:bg-pink-500/30 transition-colors"
            >
              {hashtag}
            </span>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={() => copyToClipboard(content.hashtags.join(' '), '所有标签')}
          className="mt-4"
        >
          📋 复制所有标签
        </Button>
      </Card>

      {/* 视觉建议 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* 配图建议 */}
        <Card title="🖼️ 配图建议" icon="🎨">
          <div className="space-y-4">
            {content.visuals.images.map((image) => (
              <div key={image.id} className="p-4 glass-effect rounded-lg border border-white/10">
                <p className="text-white/90 text-sm leading-relaxed">{image.suggestion}</p>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(image.suggestion, '配图建议')}
                  className="mt-3 text-xs py-1 px-3"
                >
                  📋 复制建议
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* 视频建议 */}
        <Card title="🎬 视频建议" icon="📹">
          <div className="space-y-4">
            {content.visuals.videos.map((video) => (
              <div key={video.id} className="p-4 glass-effect rounded-lg border border-white/10">
                <p className="text-white/90 text-sm leading-relaxed">{video.suggestion}</p>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(video.suggestion, '视频建议')}
                  className="mt-3 text-xs py-1 px-3"
                >
                  📋 复制建议
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 底部操作按钮 */}
      <div className="mt-12 text-center space-y-4">
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={() => router.push('/generate')}
            className="px-8 py-3"
          >
            🚀 生成新内容
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="px-8 py-3"
          >
            🏠 返回首页
          </Button>
        </div>

        <p className="text-white/50 text-sm">
          💡 提示：点击任意内容块可以快速复制，祝你创作愉快！
        </p>
      </div>
    </div>
  )
}
