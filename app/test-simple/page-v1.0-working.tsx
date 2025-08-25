'use client'

import { useState } from 'react'
import Card from '@/app/components/Card'
import Button from '@/app/components/Button'
import Input from '@/app/components/Input'

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

export default function TestSimplePage() {
  const [keyword, setKeyword] = useState('美食')
  const [sort, setSort] = useState('general')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<Note[]>([])
  const [result, setResult] = useState<SearchResult | null>(null)
  const [showCookieModal, setShowCookieModal] = useState(false)
  const [cookieInput, setCookieInput] = useState('')

  const handleSearch = async (customCookie?: string) => {
    if (!keyword.trim()) {
      setError('请输入搜索关键词')
      return
    }

    setLoading(true)
    setError('')
    setResults([])
    setResult(null)

    try {
      console.log('🔍 开始搜索:', { keyword, page, sort })
      
      const response = await fetch('http://localhost:8002/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          page,
          page_size: 10,
          sort,
          cookie: customCookie || ''
        })
      })

      console.log('📡 响应状态:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: SearchResult = await response.json()
      console.log('📊 响应数据:', data)
      
      setResult(data)
      
      if (data.success && data.data?.notes) {
        setResults(data.data.notes)
        console.log(`✅ 搜索成功，获得 ${data.data.notes.length} 条结果`)
        
        // 如果返回的是演示数据，提示用户更新Cookie
        if (data.data.status === 'demo') {
          setError('Cookie可能已过期，点击"更新Cookie"按钮重新设置')
        }
      } else {
        setError(data.error || '搜索失败')
        
        // 如果是Cookie相关错误，显示Cookie输入框
        if (data.error?.includes('cookie') || data.error?.includes('Cookie')) {
          setShowCookieModal(true)
        }
      }
      
    } catch (error) {
      console.error('搜索失败:', error)
      setError(`搜索失败: ${error instanceof Error ? error.message : '未知错误'}`)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleCookieSubmit = () => {
    if (cookieInput.trim()) {
      setShowCookieModal(false)
      handleSearch(cookieInput.trim())
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

  return (
    <div className="min-h-screen cosmic-bg p-4">
      <div className="max-w-6xl mx-auto space-y-6">
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
                onClick={() => handleSearch()}
                disabled={loading}
                className="cosmic-button"
              >
                {loading ? '🔄 搜索中...' : '🔍 开始搜索'}
              </Button>

              <Button
                onClick={() => setShowCookieModal(true)}
                variant="outline"
                className="border-white/40 hover:bg-white/10"
              >
                🍪 更新Cookie
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

        {/* Cookie输入模态框 */}
        {showCookieModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4">🍪 更新Cookie</h3>
                <p className="text-white/80 text-sm mb-4">
                  请从浏览器开发者工具中复制小红书的Cookie并粘贴到下方：
                </p>
                <textarea
                  value={cookieInput}
                  onChange={(e) => setCookieInput(e.target.value)}
                  placeholder="粘贴Cookie内容..."
                  className="cosmic-input w-full h-32 resize-none"
                />
                <div className="flex gap-3">
                  <Button onClick={handleCookieSubmit} className="flex-1">
                    ✅ 确认更新
                  </Button>
                  <Button 
                    onClick={() => setShowCookieModal(false)} 
                    variant="outline"
                    className="flex-1"
                  >
                    ❌ 取消
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

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