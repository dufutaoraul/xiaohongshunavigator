'use client'

import { useState, useEffect, useRef } from 'react'
// import { ViewNoteButton } from '../../components/ViewNoteButton'

interface HotNote {
  note_id: string
  title: string
  author: string
  liked_count: number
  comment_count: number
  url: string
  cover_image?: string
  tags?: string[]
}

interface HotContentCarouselProps {
  className?: string
}

export default function HotContentCarousel({ className = '' }: HotContentCarouselProps) {
  const [hotNotes, setHotNotes] = useState<HotNote[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 获取热门内容
  const fetchHotContent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/hot-content', {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error('获取热门内容失败')
      }

      const result = await response.json()
      if (result.success && result.data) {
        setHotNotes(result.data)
        setError('')
      } else {
        throw new Error(result.error || '获取热门内容失败')
      }
    } catch (error) {
      console.error('获取热门内容失败:', error)
      setError(error instanceof Error ? error.message : '获取热门内容失败')
      // 使用模拟数据
      setHotNotes([
        {
          note_id: 'demo1',
          title: '小红书爆款文案写作技巧分享！新手必看',
          author: '文案小达人',
          liked_count: 12580,
          comment_count: 456,
          url: 'https://www.xiaohongshu.com/explore/demo1',
          tags: ['文案写作', '小红书运营', '新手教程']
        },
        {
          note_id: 'demo2',
          title: 'AI工具让我的工作效率提升300%！',
          author: 'AI探索者',
          liked_count: 8920,
          comment_count: 234,
          url: 'https://www.xiaohongshu.com/explore/demo2',
          tags: ['AI工具', '效率提升', '职场技能']
        },
        {
          note_id: 'demo3',
          title: '90天学会小红书运营，从0到10万粉丝',
          author: '运营大神',
          liked_count: 15600,
          comment_count: 789,
          url: 'https://www.xiaohongshu.com/explore/demo3',
          tags: ['小红书运营', '涨粉技巧', '内容创作']
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // 自动轮播
  const startAutoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === hotNotes.length - 1 ? 0 : prevIndex + 1
      )
    }, 4000) // 4秒切换一次
  }

  // 停止自动轮播
  const stopAutoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // 手动切换
  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    stopAutoPlay()
    // 2秒后重新开始自动轮播
    setTimeout(startAutoPlay, 2000)
  }

  // 上一个
  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? hotNotes.length - 1 : currentIndex - 1
    goToSlide(newIndex)
  }

  // 下一个
  const goToNext = () => {
    const newIndex = currentIndex === hotNotes.length - 1 ? 0 : currentIndex + 1
    goToSlide(newIndex)
  }

  useEffect(() => {
    fetchHotContent()
  }, [])

  useEffect(() => {
    if (hotNotes.length > 1) {
      startAutoPlay()
    }
    return () => stopAutoPlay()
  }, [hotNotes])

  if (loading) {
    return (
      <div className={`glass-effect p-6 rounded-lg ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="text-3xl mb-2">🔄</div>
            <p className="text-white/60">加载热门内容中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || hotNotes.length === 0) {
    return (
      <div className={`glass-effect p-6 rounded-lg ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="text-3xl mb-2">📱</div>
            <p className="text-white/60">暂无热门内容</p>
            <button
              onClick={fetchHotContent}
              className="mt-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-300 text-sm transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentNote = hotNotes[currentIndex]

  return (
    <div className={`glass-effect p-6 rounded-lg relative overflow-hidden ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          <span className="text-2xl mr-2">🔥</span>
          热门爆款轮播
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevious}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            ‹
          </button>
          <button
            onClick={goToNext}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* 轮播内容 */}
      <div className="relative h-40 mb-4">
        <div className="absolute inset-0 transition-all duration-500 ease-in-out">
          <div className="h-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-lg p-4">
            <h4 className="text-white font-medium text-lg mb-2 line-clamp-2">
              {currentNote.title}
            </h4>
            <div className="flex items-center space-x-4 text-sm text-white/60 mb-3">
              <span>👤 {currentNote.author}</span>
              <span>❤️ {currentNote.liked_count.toLocaleString()}</span>
              <span>💬 {currentNote.comment_count}</span>
            </div>
            {currentNote.tags && (
              <div className="flex flex-wrap gap-1 mb-3">
                {currentNote.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <a
              href={currentNote.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm rounded-lg transition-all"
            >
              查看详情 →
            </a>
          </div>
        </div>
      </div>

      {/* 指示器 */}
      <div className="flex justify-center space-x-2">
        {hotNotes.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-purple-400 w-6'
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-full translate-y-8 -translate-x-8"></div>
    </div>
  )
}
