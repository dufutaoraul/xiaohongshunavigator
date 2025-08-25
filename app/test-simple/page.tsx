'use client'

import { useState, useEffect } from 'react'
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
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  // 检查是否有保存的Cookie - 修复水合错误
  const [hasCookie, setHasCookie] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // 在客户端挂载后检查Cookie
  useEffect(() => {
    setIsClient(true)
    // 检查是否有保存的Cookie
    const savedCookie = localStorage.getItem('xhs_cookie')
    if (savedCookie) {
      setHasCookie(true)
    } else {
      // 只有没有Cookie时才显示对话框
      setShowCookieModal(true)
    }
  }, [])

  const handleSearch = async (customCookie?: string) => {
    if (!keyword.trim()) {
      setError('请输入搜索关键词')
      return
    }

    // 检查Cookie
    const savedCookie = customCookie || localStorage.getItem('xhs_cookie')
    if (!savedCookie) {
      setError('请先配置Cookie后再搜索')
      setShowCookieModal(true)
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
      // 保存Cookie到localStorage
      localStorage.setItem('xhs_cookie', cookieInput.trim())
      setHasCookie(true)
      setShowCookieModal(false)
      // 不自动搜索，让用户手动点击搜索按钮
    }
  }

  // 打开Cookie模态框时加载现有Cookie
  // 打开Cookie模态框时加载现有Cookie
  const openCookieModal = () => {
    if (isClient) {
      const savedCookie = localStorage.getItem('xhs_cookie')
      if (savedCookie) {
        setCookieInput(savedCookie)
      } else {
        setCookieInput('')
      }
    }
    setShowCookieModal(true)
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    setPage(page + 1)
  }

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note)
    setShowNoteModal(true)
  }

  const generateQRCode = (noteId: string) => {
    const url = `https://www.xiaohongshu.com/explore/${noteId}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
  }

  const getSortLabel = (sortValue: string) => {
    switch (sortValue) {
      case 'general': return '综合'
      case 'time': return '最新'
      case 'like': return '点赞最多'
      default: return '综合'
    }
  }

  return (
    <div className="min-h-screen cosmic-bg p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cookie状态指示器 */}
        {isClient && (
          <Card className="backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                hasCookie 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {hasCookie ? '✅ Cookie已配置' : '❌ 未配置Cookie'}
              </span>
              <span className="text-white/70 text-sm">
                {hasCookie ? '可以正常搜索' : '请先配置Cookie后再搜索'}
              </span>
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
                  onChange={(e) => {
                    setSort(e.target.value)
                    // 排序改变时不自动搜索，让用户手动点击搜索按钮
                  }}
                  className="cosmic-input w-full px-4 py-3 text-white bg-white/10 border border-white/20 rounded-lg focus:scale-105 transition-all duration-300"
                  style={{ color: 'white' }}
                >
                  <option value="general" style={{ color: 'black' }}>🎯 综合排序</option>
                  <option value="time" style={{ color: 'black' }}>⏰ 最新发布</option>
                  <option value="like" style={{ color: 'black' }}>❤️ 点赞最多</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={() => handleSearch()}
                disabled={loading || !hasCookie}
                className="cosmic-button"
              >
                {loading ? '🔄 搜索中...' : '🔍 开始搜索'}
              </Button>

              <Button
                onClick={openCookieModal}
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
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">🍪 配置小红书Cookie</h3>
                
                {/* Cookie获取教程 */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-300 font-semibold mb-3">📚 Cookie获取教程</h4>
                  <div className="text-center mb-4">
                    <a 
                      href="https://tcnlkdeey4g8.feishu.cn/wiki/VvEmw2j33izxorkdUClck50en9b" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      📖 点击查看详细教程
                    </a>
                  </div>
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <p className="text-yellow-300 text-xs">
                      ⚠️ <strong>重要提示:</strong> Cookie包含你的登录信息，请妥善保管，不要分享给他人
                    </p>
                  </div>
                </div>

                {/* Cookie输入框 */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    粘贴Cookie内容:
                  </label>
                  <textarea
                    value={cookieInput}
                    onChange={(e) => setCookieInput(e.target.value)}
                    placeholder="请粘贴从浏览器开发者工具中复制的完整Cookie内容..."
                    className="cosmic-input w-full h-32 resize-none text-sm"
                  />
                </div>

                {/* 按钮组 */}
                <div className="flex gap-3">
                  <Button onClick={handleCookieSubmit} className="flex-1">
                    ✅ 保存并搜索
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowCookieModal(false)
                    }} 
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
            
            {/* 笔记列表 - 无图片版本 */}
            <div className="space-y-4">
              {results.map((note, index) => (
                <div 
                  key={note.note_id || index} 
                  className="glass-effect rounded-xl p-6 hover:scale-[1.02] transition-all duration-300 floating-card"
                >
                  {/* 头部：标题 */}
                  <div className="mb-4">
                    <h3 
                      className="font-semibold text-white text-lg leading-relaxed cursor-pointer hover:text-blue-300 transition-colors"
                      onClick={() => handleNoteClick(note)}
                    >
                      {note.title || '无标题'}
                    </h3>
                  </div>
                  
                  {/* 描述 */}
                  {note.desc && (
                    <p className="text-white/80 mb-3 text-sm leading-relaxed line-clamp-3">
                      <span className="text-xs text-blue-300 mr-2">📝 描述:</span>
                      {note.desc}
                    </p>
                  )}
                  
                  {/* 底部信息栏 */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    {/* 用户信息 */}
                    <div className="flex items-center gap-2 text-white/70">
                      <span className="breathing-glow">👤</span>
                      <span className="text-sm">{note.user?.nickname || '匿名用户'}</span>
                    </div>
                    
                    {/* 互动数据 */}
                    <div className="flex items-center gap-6 text-white/70">
                      <div className="flex items-center gap-1">
                        <span className="breathing-glow text-red-400">❤️</span>
                        <span className="text-sm">{note.interact_info?.liked_count || '0'}</span>
                        <span className="text-xs text-white/50">点赞</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="breathing-glow text-blue-400">💬</span>
                        <span className="text-sm">{note.interact_info?.comment_count || '0'}</span>
                        <span className="text-xs text-white/50">评论</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="breathing-glow text-yellow-400">⭐</span>
                        <span className="text-sm">{note.interact_info?.collected_count || '0'}</span>
                        <span className="text-xs text-white/50">收藏</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 笔记类型标识 */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">
                        ID: {note.note_id.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 笔记详情模态框 */}
        {showNoteModal && selectedNote && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">📝 笔记详情</h3>
                  <Button 
                    onClick={() => setShowNoteModal(false)}
                    variant="outline"
                    className="px-3 py-1 text-sm"
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 左侧：笔记信息 */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-white mb-2">{selectedNote.title}</h4>
                      <p className="text-white/70 text-sm">{selectedNote.desc}</p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">👤 作者:</span>
                        <span className="text-white">{selectedNote.user?.nickname || '匿名'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">❤️ 点赞:</span>
                        <span className="text-white">{selectedNote.interact_info?.liked_count || '0'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">💬 评论:</span>
                        <span className="text-white">{selectedNote.interact_info?.comment_count || '0'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">⭐ 收藏:</span>
                        <span className="text-white">{selectedNote.interact_info?.collected_count || '0'}</span>
                      </div>
                    </div>

                    <div className="p-4 glass-effect rounded-lg">
                      <p className="text-white/80 text-sm mb-2">
                        🔗 <strong>访问说明:</strong>
                      </p>
                      <p className="text-white/60 text-xs leading-relaxed">
                        由于小红书的访问限制，无法直接跳转到笔记页面。请使用小红书扫描右侧二维码，或复制链接在小红书App中打开查看完整内容。
                      </p>
                      <div className="mt-3 p-2 bg-black/30 rounded text-xs text-white/70 break-all">
                        https://www.xiaohongshu.com/explore/{selectedNote.note_id}
                      </div>
                    </div>
                  </div>

                  {/* 右侧：二维码 */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="aspect-square w-48 bg-white p-4 rounded-lg">
                      <img
                        src={generateQRCode(selectedNote.note_id)}
                        alt="笔记二维码"
                        className="w-full h-full"
                      />
                    </div>
                    <p className="text-white/60 text-xs text-center">
                      使用小红书扫描二维码<br/>在小红书中查看完整笔记
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
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