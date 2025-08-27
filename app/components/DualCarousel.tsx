'use client'

import { useState, useEffect, useRef } from 'react'

interface CarouselItem {
  id: string
  title: string
  author: string
  nickname?: string
  liked_count: number
  comment_count: number
  url: string
  cover_image?: string
  tags?: string[]
}

interface DualCarouselProps {
  className?: string
}

export default function DualCarousel({ className = '' }: DualCarouselProps) {
  const [aiIndustryNotes, setAiIndustryNotes] = useState<CarouselItem[]>([])
  const [studentNotes, setStudentNotes] = useState<CarouselItem[]>([])
  const [aiCurrentIndex, setAiCurrentIndex] = useState(0)
  const [studentCurrentIndex, setStudentCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState<CarouselItem | null>(null)
  const aiIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const studentIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 获取AI行业爆款
  const fetchAiIndustryContent = async () => {
    try {
      const response = await fetch('/api/hot-content')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setAiIndustryNotes(result.data.map((note: any) => ({
            id: note.note_id,
            title: note.title,
            author: note.author,
            nickname: note.nickname,
            liked_count: note.liked_count,
            comment_count: note.comment_count,
            url: note.url,
            cover_image: note.cover_image,
            tags: note.tags
          })))
          return
        }
      }
    } catch (error) {
      console.error('获取AI行业内容失败:', error)
    }
    
    // 演示数据
    setAiIndustryNotes([
      {
        id: 'ai1',
        title: 'ChatGPT最新功能解析，效率提升200%！',
        author: 'AI科技前沿',
        liked_count: 15600,
        comment_count: 789,
        url: 'https://www.xiaohongshu.com/explore/ai1',
        tags: ['ChatGPT', 'AI工具', '效率提升']
      },
      {
        id: 'ai2',
        title: 'Midjourney绘画技巧大全，新手必看',
        author: 'AI绘画大师',
        liked_count: 12300,
        comment_count: 456,
        url: 'https://www.xiaohongshu.com/explore/ai2',
        tags: ['Midjourney', 'AI绘画', '设计']
      },
      {
        id: 'ai3',
        title: '10个AI工具让你的工作效率翻倍',
        author: '效率达人',
        liked_count: 18900,
        comment_count: 923,
        url: 'https://www.xiaohongshu.com/explore/ai3',
        tags: ['AI工具', '工作效率', '生产力']
      }
    ])
  }

  // 获取优秀学员爆款
  const fetchStudentContent = async () => {
    try {
      const response = await fetch('/api/student-stats?action=hot_posts&limit=10')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data && result.data.length > 0) {
          setStudentNotes(result.data.map((post: any) => ({
            id: post.post_id,
            title: post.title,
            author: post.student_id,
            nickname: post.student_name,
            liked_count: post.like_count,
            comment_count: post.comment_count,
            url: post.post_url,
            cover_image: post.cover_image_url
          })))
          return
        }
      }
    } catch (error) {
      console.error('获取学员内容失败:', error)
    }
    
    // 演示数据
    setStudentNotes([
      {
        id: 'student1',
        title: '我的AI学习之路：从小白到专家',
        author: '20240001',
        nickname: '学员小王',
        liked_count: 2300,
        comment_count: 156,
        url: 'https://www.xiaohongshu.com/explore/student1'
      },
      {
        id: 'student2',
        title: '用AI工具3天完成毕业设计',
        author: '20240002',
        nickname: '学员小李',
        liked_count: 1890,
        comment_count: 234,
        url: 'https://www.xiaohongshu.com/explore/student2'
      },
      {
        id: 'student3',
        title: 'AI创业第一个月收入过万',
        author: '20240003',
        nickname: '学员小张',
        liked_count: 3456,
        comment_count: 567,
        url: 'https://www.xiaohongshu.com/explore/student3'
      }
    ])
  }

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      setLoading(true)
      await Promise.all([
        fetchAiIndustryContent(),
        fetchStudentContent()
      ])
      setLoading(false)
    }
    initData()
  }, [])

  // AI行业轮播
  useEffect(() => {
    if (aiIndustryNotes.length > 1) {
      aiIntervalRef.current = setInterval(() => {
        setAiCurrentIndex(prev => (prev + 1) % aiIndustryNotes.length)
      }, 4000)
    }
    return () => {
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current)
    }
  }, [aiIndustryNotes.length])

  // 学员轮播
  useEffect(() => {
    if (studentNotes.length > 1) {
      studentIntervalRef.current = setInterval(() => {
        setStudentCurrentIndex(prev => (prev + 1) % studentNotes.length)
      }, 5000)
    }
    return () => {
      if (studentIntervalRef.current) clearInterval(studentIntervalRef.current)
    }
  }, [studentNotes.length])

  const handleNoteClick = (note: CarouselItem) => {
    // 尝试直接打开链接
    try {
      window.open(note.url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      // 如果失败，显示二维码
      setSelectedNote(note)
      setShowQRModal(true)
    }
  }

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="space-y-6">
          <div className="h-32 bg-white/10 rounded-lg"></div>
          <div className="h-32 bg-white/10 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* AI行业爆款轮播 */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            🔥 AI行业爆款
          </h3>
          <div className="flex space-x-2">
            {aiIndustryNotes.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === aiCurrentIndex ? 'bg-purple-400' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
        
        {aiIndustryNotes.length > 0 && (
          <div 
            className="cursor-pointer hover:bg-white/5 rounded-lg p-4 transition-colors"
            onClick={() => handleNoteClick(aiIndustryNotes[aiCurrentIndex])}
          >
            <h4 className="text-white font-medium mb-2 line-clamp-2">
              {aiIndustryNotes[aiCurrentIndex].title}
            </h4>
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>@{aiIndustryNotes[aiCurrentIndex].author}</span>
              <div className="flex items-center space-x-4">
                <span>❤️ {aiIndustryNotes[aiCurrentIndex].liked_count}</span>
                <span>💬 {aiIndustryNotes[aiCurrentIndex].comment_count}</span>
              </div>
            </div>
            {aiIndustryNotes[aiCurrentIndex].tags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {aiIndustryNotes[aiCurrentIndex].tags?.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 优秀学员爆款轮播 */}
      <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-400/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            🌟 优秀学员爆款
          </h3>
          <div className="flex space-x-2">
            {studentNotes.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === studentCurrentIndex ? 'bg-green-400' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
        
        {studentNotes.length > 0 && (
          <div 
            className="cursor-pointer hover:bg-white/5 rounded-lg p-4 transition-colors"
            onClick={() => handleNoteClick(studentNotes[studentCurrentIndex])}
          >
            <h4 className="text-white font-medium mb-2 line-clamp-2">
              {studentNotes[studentCurrentIndex].title}
            </h4>
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>@{studentNotes[studentCurrentIndex].nickname || studentNotes[studentCurrentIndex].author}</span>
              <div className="flex items-center space-x-4">
                <span>❤️ {studentNotes[studentCurrentIndex].liked_count}</span>
                <span>💬 {studentNotes[studentCurrentIndex].comment_count}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 二维码模态框 */}
      {showQRModal && selectedNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">扫码查看原文</h3>
              <div className="bg-white p-4 rounded-lg mb-4">
                <div className="w-48 h-48 mx-auto bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">二维码</span>
                </div>
              </div>
              <p className="text-white/70 text-sm mb-4">
                请使用小红书App扫描二维码查看完整内容
              </p>
              <button
                onClick={() => setShowQRModal(false)}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
