'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/app/components/Card'
import Button from '@/app/components/Button'
import Input from '@/app/components/Input'
import CookieModal from '@/app/components/CookieModal'
import { useCookieManager } from '@/app/hooks/useCookieManager'

interface Note {
  note_id: string
  title: string
  desc: string
  type: string
  user: {
    nickname: string
    user_id: string
  }
  interact_info: {
    liked_count: string
    comment_count: string
    collected_count: string
  }
  cover: string
}

interface SearchResult {
  success: boolean
  data?: {
    message: string
    keyword: string
    page: number
    page_size: number
    status: string
    total_count: number
    notes: Note[]
  }
  error?: string
}

export default function SearchPage() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('美食')
  const [sort, setSort] = useState('general')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<Note[]>([])
  const [result, setResult] = useState<SearchResult | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [studentId, setStudentId] = useState('')

  const cookieManager = useCookieManager()

  // 检查身份验证
  useEffect(() => {
    const userSession = localStorage.getItem('userSession')
    if (userSession) {
      try {
        const session = JSON.parse(userSession)
        if (session.isAuthenticated) {
          setIsAuthenticated(true)
          setStudentId(session.student_id)
          return
        }
      } catch {
        // 忽略解析错误
      }
    }

    // 未认证，跳转到首页
    router.push('/')
  }, [router])

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError('请输入搜索关键词')
      return
    }

    // 检查是否有保存的Cookie
    const savedCookie = localStorage.getItem('xhs_cookie')
    console.log('🔍 [DEBUG] localStorage中的Cookie:', savedCookie ? `${savedCookie.substring(0, 50)}...` : 'null')
    
    if (!savedCookie) {
      setError('请先配置Cookie后再搜索')
      cookieManager.openCookieModal()
      return
    }

    setLoading(true)
    setError('')
    setResults([])
    setResult(null)

    try {
      console.log('🔍 开始搜索:', { keyword, page, sort })
      console.log('🍪 使用保存的Cookie:', savedCookie.substring(0, 50) + '...')
      
      const requestBody = {
        keyword: keyword.trim(),
        page,
        page_size: 10,
        sort,
        cookie: savedCookie,
        student_id: studentId
      }
      console.log('📤 [DEBUG] 发送的请求体:', { ...requestBody, cookie: requestBody.cookie ? `${requestBody.cookie.substring(0, 50)}...` : 'null' })
      
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📡 响应状态:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📊 响应数据:', data)

      if (data.success && data.data?.notes) {
        // 转换数据格式以适配前端组件
        const convertedNotes = data.data.notes.map((note: any) => ({
          note_id: note.note_id,
          title: note.title,
          desc: note.title, // 使用标题作为描述
          type: 'normal',
          user: {
            nickname: note.nickname || note.author_name || '匿名用户',
            user_id: note.author || note.author_id || ''
          },
          interact_info: {
            liked_count: String(note.liked_count || 0),
            comment_count: String(note.comment_count || 0),
            collected_count: '0'
          },
          cover: note.cover_image || note.cover_url || ''
        }))

        setResults(convertedNotes)
        console.log(`✅ 搜索成功，获得 ${convertedNotes.length} 条结果`)

        // 构造兼容的结果对象
        setResult({
          success: true,
          data: {
            message: data.data.message || '搜索成功',
            keyword: data.data.keyword || keyword,
            page: data.data.page || page,
            page_size: data.data.page_size || 10,
            status: data.data.source === 'demo' ? 'demo' : 'success',
            total_count: convertedNotes.length,
            notes: convertedNotes
          }
        })

        // 如果返回的是演示数据，提示用户更新Cookie
        if (data.data.source === 'demo') {
          setError('当前显示演示数据，请配置有效的Cookie获取真实数据')
        }
      } else {
        setError(data.error || '搜索失败')

        // 如果是Cookie相关错误，显示Cookie配置对话框
        if (data.error?.includes('cookie') || data.error?.includes('Cookie')) {
          cookieManager.handleApiError(data)
        }
      }
      
    } catch (error) {
      console.error('搜索失败:', error)
      setError(`搜索失败: ${error instanceof Error ? error.message : '未知错误'}`)
      setResults([])
      
      // 如果是网络错误，可能是Cookie问题
      cookieManager.handleApiError(error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    setPage(page + 1)
  }

  const getSortLabel = (sortValue: string) => {
    switch (sortValue) {
      case 'general': return '综合'
      case 'time': return '最新'
      case 'like': return '点赞'
      default: return '综合'
    }
  }

  // 如果未认证，显示加载状态
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-white/80">正在验证身份...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen cosmic-bg p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cookie状态指示器 */}
        {!cookieManager.isLoading && (
          <Card className="backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  cookieManager.hasCookie 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {cookieManager.hasCookie ? '✅ Cookie已配置' : '❌ 未配置Cookie'}
                </span>
                <span className="text-white/70 text-sm">
                  {cookieManager.hasCookie ? '可以正常搜索' : '请先配置Cookie后再搜索'}
                </span>
              </div>
              <Button
                onClick={cookieManager.openCookieModal}
                variant="outline"
                className="h-9 rounded-md px-3 border-white/40 hover:bg-white/10"
              >
                🍪 {cookieManager.hasCookie ? '更新Cookie' : '配置Cookie'}
              </Button>
            </div>
          </Card>
        )}

        {/* 搜索表单 */}
        <Card 
          title="🔍 小红书搜索" 
          icon="🌟"
          className="backdrop-blur-md"
        >
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="搜索关键词"
                value={keyword}
                onChange={setKeyword}
                placeholder="输入搜索关键词，如：美食、旅行、穿搭..."
              />

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  排序方式
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="cosmic-input w-full px-4 py-3 text-white focus:scale-105 transition-all duration-300"
                >
                  <option value="general">🎯 综合排序</option>
                  <option value="time">⏰ 最新发布</option>
                  <option value="like">❤️ 点赞最多</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={handleSearch}
                disabled={loading || !cookieManager.hasCookie}
                className="cosmic-button"
              >
                {loading ? '🔄 搜索中...' : '🔍 开始搜索'}
              </Button>



              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrevPage}
                  disabled={loading || page <= 1}
                  variant="outline"
                  className="px-4 py-2 text-sm"
                >
                  ← 上一页
                </Button>
                <span className="text-white/80 px-3 py-2 glass-effect rounded-lg">
                  第 {page} 页
                </span>
                <Button
                  onClick={handleNextPage}
                  disabled={loading}
                  variant="outline"
                  className="px-4 py-2 text-sm"
                >
                  下一页 →
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Cookie配置对话框 */}
        <CookieModal
          isOpen={cookieManager.isModalOpen}
          onClose={cookieManager.closeCookieModal}
          onCookieSaved={cookieManager.onCookieSaved}
        />

        {/* 错误提示 */}
        {error && (
          <Card className="glass-effect border border-red-400/30">
            <div className="text-red-300 flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* 搜索结果 */}
        {results.length > 0 && (
          <Card 
            title={`📝 搜索结果 (${results.length} 条)`}
            icon="🎉"
            className="backdrop-blur-md"
          >
            {/* 状态指示器 */}
            {result?.data && (
              <div className="mb-6 p-4 glass-effect rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.data.status === 'real' 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                      : result.data.status === 'demo'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {result.data.status === 'real' ? '✅ 真实数据' : 
                     result.data.status === 'demo' ? '⚠️ 演示数据' : '❌ 错误'}
                  </span>
                </div>
                <div className="text-sm text-white/70 space-y-1">
                  <div>🔍 关键词: <span className="text-white">{result.data.keyword}</span></div>
                  <div>📊 排序: <span className="text-white">{getSortLabel(sort)}</span></div>
                  <div>📄 页码: <span className="text-white">{result.data.page}</span></div>
                </div>
              </div>
            )}
            
            {/* 笔记网格 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((note, index) => (
                <div key={note.note_id || index} className="glass-effect rounded-xl p-4 hover:scale-105 transition-all duration-300 floating-card">
                  {/* 封面图片 */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg mb-4 overflow-hidden">
                    <img
                      src={note.cover}
                      alt={note.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'https://via.placeholder.com/300x400/6366f1/ffffff?text=小红书'
                      }}
                    />
                  </div>
                  
                  {/* 标题 */}
                  <h3 className="font-semibold text-white mb-2 line-clamp-2 text-sm leading-relaxed">
                    {note.title || '无标题'}
                  </h3>
                  
                  {/* 描述 */}
                  <p className="text-white/70 mb-3 line-clamp-2 text-xs leading-relaxed">
                    {note.desc || '无描述'}
                  </p>
                  
                  {/* 用户信息和互动数据 */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-white/60">
                      <span className="breathing-glow">👤</span>
                      <span className="truncate max-w-20">{note.user?.nickname || '匿名'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/60">
                      <div className="flex items-center gap-1">
                        <span className="breathing-glow text-red-400">❤️</span>
                        <span>{note.interact_info?.liked_count || '0'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="breathing-glow text-blue-400">💬</span>
                        <span>{note.interact_info?.comment_count || '0'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 调试信息 */}
        {result && (
          <Card title="🔧 调试信息" className="backdrop-blur-md">
            <details className="text-white/80">
              <summary className="cursor-pointer font-medium mb-3 hover:text-white transition-colors">
                点击查看原始响应数据
              </summary>
              <pre className="text-xs bg-black/30 p-4 rounded-lg overflow-auto max-h-96 border border-white/10">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </Card>
        )}
      </div>
    </div>
  )
}