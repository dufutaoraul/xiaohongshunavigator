// 热门帖子推荐组件
// 在AI内容生成页面显示相关热门帖子供用户参考

'use client'

import { useState, useEffect } from 'react'
import Card from './Card'
import Button from './Button'

interface TrendingPost {
  id: string
  title: string
  description: string
  author: {
    userId: string
    nickname: string
    avatar?: string
  }
  stats: {
    likes: number
    comments: number
    shares: number
    collections: number
  }
  publishTime: string
  url: string
  trendingScore: number
  ranking: number
}

interface KeywordSearchResult {
  keyword: string
  posts: TrendingPost[]
  totalFound: number
  cached: boolean
  searchTime: string
}

interface TrendingPostsWidgetProps {
  keywords?: string
  studentId?: string
  className?: string
}

export default function TrendingPostsWidget({
  keywords,
  studentId,
  className = ''
}: TrendingPostsWidgetProps) {
  const [searchResults, setSearchResults] = useState<KeywordSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchMode, setSearchMode] = useState<'keyword' | 'personalized'>('keyword')

  // 当keywords变化时自动搜索
  useEffect(() => {
    if (keywords && keywords.trim()) {
      searchByKeywords(keywords.trim())
    }
  }, [keywords])

  const searchByKeywords = async (searchKeywords: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/xhs/keyword-search?keywords=${encodeURIComponent(searchKeywords)}&limit=6&sortBy=popular`
      )

      if (!response.ok) {
        throw new Error(`搜索失败: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setSearchResults([result.data])
        setSearchMode('keyword')
      } else {
        throw new Error(result.error || '搜索失败')
      }
    } catch (error) {
      console.error('关键词搜索失败:', error)
      setError(error instanceof Error ? error.message : '搜索失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const getPersonalizedRecommendations = async () => {
    if (!studentId) {
      setError('需要学员ID才能获取个性化推荐')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/xhs/keyword-search/personalized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: studentId,
          limit: 4
        })
      })

      if (!response.ok) {
        throw new Error(`获取推荐失败: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setSearchResults(result.data.recommendations)
        setSearchMode('personalized')
      } else {
        throw new Error(result.error || '获取推荐失败')
      }
    } catch (error) {
      console.error('获取个性化推荐失败:', error)
      setError(error instanceof Error ? error.message : '获取推荐失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}w`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))

    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
    return `${Math.floor(diffDays / 30)}月前`
  }

  const PostCard = ({ post }: { post: TrendingPost }) => (
    <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-white/10 rounded-lg p-4 hover:border-purple-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {post.ranking}
          </div>
          <div className="ml-3">
            <div className="text-white font-medium text-sm">{post.author.nickname}</div>
            <div className="text-white/60 text-xs">{formatDate(post.publishTime)}</div>
          </div>
        </div>
        <div className="text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded">
          热度 {post.trendingScore}
        </div>
      </div>

      <h4 className="text-white font-medium text-sm mb-2 line-clamp-2">
        {post.title}
      </h4>

      <p className="text-white/70 text-xs mb-3 line-clamp-2">
        {post.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-white/60">
          <span>❤️ {formatNumber(post.stats.likes)}</span>
          <span>💬 {formatNumber(post.stats.comments)}</span>
          <span>⭐ {formatNumber(post.stats.collections)}</span>
        </div>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-300 hover:text-purple-200 text-xs underline"
        >
          查看原文
        </a>
      </div>
    </div>
  )

  if (!keywords && !studentId) {
    return null
  }

  return (
    <div className={className}>
      <Card
        title="💡 热门帖子参考"
        icon="🔥"
        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/30"
      >
        <div className="space-y-4">
          {/* 控制按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {studentId && (
                <Button
                  onClick={getPersonalizedRecommendations}
                  disabled={loading}
                  className="text-xs px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-300"
                >
                  {loading ? '获取中...' : '个性化推荐'}
                </Button>
              )}
              {keywords && (
                <Button
                  onClick={() => searchByKeywords(keywords)}
                  disabled={loading}
                  className="text-xs px-3 py-1 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/30 text-pink-300"
                >
                  {loading ? '搜索中...' : '相关热门'}
                </Button>
              )}
            </div>

            {searchResults.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-white/60 hover:text-white/80 transition-colors"
              >
                {isExpanded ? '收起 ↑' : '展开 ↓'}
              </button>
            )}
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="text-red-300 text-sm bg-red-500/10 border border-red-400/30 rounded p-3">
              {error}
            </div>
          )}

          {/* 加载状态 */}
          {loading && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔄</div>
              <p className="text-white/60 text-sm">正在搜索热门帖子...</p>
            </div>
          )}

          {/* 搜索结果 */}
          {searchResults.length > 0 && !loading && (
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div key={index} className="space-y-3">
                  {searchMode === 'personalized' && (
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-white">
                        🏷️ {result.keyword}
                      </h4>
                      <span className="text-xs text-white/60">
                        找到 {result.posts.length} 个热门帖子
                      </span>
                    </div>
                  )}

                  <div className={`grid gap-3 ${
                    isExpanded
                      ? 'grid-cols-1'
                      : result.posts.length >= 4
                        ? 'grid-cols-2'
                        : 'grid-cols-1'
                  }`}>
                    {result.posts.slice(0, isExpanded ? 10 : 4).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>

                  {result.cached && (
                    <p className="text-xs text-green-300/70">
                      ✅ 数据来自缓存，搜索时间: {formatDate(result.searchTime)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 空状态 */}
          {searchResults.length === 0 && !loading && !error && (
            <div className="text-center py-8 text-white/60">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-sm">点击上方按钮获取热门帖子推荐</p>
              <p className="text-xs mt-1">AI将为你推荐相关的优质内容作为创作参考</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}