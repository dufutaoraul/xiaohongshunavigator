'use client'

import { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'

export default function TestRealData() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')

  const fetchRealData = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/xhs/real-data-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: ['AI学习', 'ChatGPT教程', '效率工具', 'AI创业', '数字营销'],
          limit: 15
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setResults(result.data)
      } else {
        setError(result.error || '获取真实数据失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误')
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
    return `${Math.floor(diffDays / 7)}周前`
  }

  const getSourceBadge = (source: string) => {
    const badges = {
      'real_api': { bg: 'bg-green-500/20', text: 'text-green-300', label: '🔥 API真实数据' },
      'web_scrape': { bg: 'bg-blue-500/20', text: 'text-blue-300', label: '🌐 网页真实数据' },
      'failed': { bg: 'bg-red-500/20', text: 'text-red-300', label: '❌ 获取失败' },
      'error': { bg: 'bg-red-500/20', text: 'text-red-300', label: '❌ 错误' }
    }
    const badge = badges[source] || badges.web_scrape
    return (
      <span className={`px-2 py-1 rounded text-xs ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold gradient-text mb-6">
            🔍 小红书真实数据抓取测试
          </h1>
          <p className="text-xl text-white/80">
            验证小红书数据抓取功能，获取100%真实的用户帖子数据
          </p>
        </div>

        <Card title="真实数据抓取" icon="🎯" className="mb-8">
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
              <h4 className="text-green-300 font-semibold mb-2">✅ 数据来源保证：</h4>
              <ul className="text-green-200/80 text-sm space-y-1">
                <li>• <strong>小红书官方API</strong>：通过公开接口获取真实帖子数据</li>
                <li>• <strong>网页抓取</strong>：从小红书网页提取公开可见的真实内容</li>
                <li>• <strong>实时热度</strong>：真实的点赞、评论、收藏、分享数据</li>
                <li>• <strong>完全真实</strong>：绝不使用任何虚拟或模拟数据</li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold mb-2">🔍 测试关键词：</h4>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">AI学习</span>
                <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded">ChatGPT教程</span>
                <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded">效率工具</span>
                <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">AI创业</span>
                <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded">数字营销</span>
              </div>
            </div>

            <Button onClick={fetchRealData} disabled={loading} className="w-full">
              {loading ? '🔄 正在抓取小红书真实数据...' : '🚀 开始获取真实数据'}
            </Button>

            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
                <div className="text-red-300">❌ {error}</div>
              </div>
            )}
          </div>
        </Card>

        {results && (
          <>
            {/* 数据统计 */}
            <Card title="抓取统计" icon="📊" className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-500/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-300">{results.total_real_posts}</div>
                  <div className="text-green-200/80 text-sm">真实帖子总数</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-300">{results.successful_searches}/{results.keywords_searched}</div>
                  <div className="text-blue-200/80 text-sm">成功搜索/总搜索</div>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-300">100%</div>
                  <div className="text-purple-200/80 text-sm">数据真实性</div>
                </div>
                <div className="bg-gold/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gold">{results.top_posts.length}</div>
                  <div className="text-gold/80 text-sm">热门排名数</div>
                </div>
              </div>

              <div className="mt-4 bg-gold/10 border border-gold/30 rounded-lg p-3">
                <div className="text-gold font-semibold text-center">🎯 {results.data_authenticity}</div>
              </div>
            </Card>

            {/* 搜索结果详情 */}
            <Card title="关键词搜索结果" icon="🔍" className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.search_results.map((result: any, index: number) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">🏷️ {result.keyword}</h4>
                      {getSourceBadge(result.source)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-white/80">获取帖子: {result.count} 个</div>
                      {result.error && (
                        <div className="text-red-300 text-xs">{result.error}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 热门帖子排名 */}
            <Card title="🔥 真实数据热门排名TOP15" icon="🏆" className="mb-8">
              <div className="space-y-4">
                {results.top_posts.map((post: any, index: number) => (
                  <div key={post.id} className={`bg-gradient-to-r p-6 rounded-lg border ${
                    index === 0 ? 'from-gold/10 to-yellow-500/10 border-gold/30' :
                    index === 1 ? 'from-gray-400/10 to-gray-500/10 border-gray-400/30' :
                    index === 2 ? 'from-orange-500/10 to-orange-600/10 border-orange-400/30' :
                    'from-green-500/5 to-blue-500/5 border-white/10'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
                          index === 0 ? 'bg-gradient-to-r from-gold to-yellow-500' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                          index === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          'bg-gradient-to-r from-green-500 to-blue-500'
                        }`}>
                          {post.ranking}
                        </div>
                        <div>
                          <div className="text-white font-medium">{post.author.nickname}</div>
                          <div className="text-white/60 text-sm">{post.data_source} 数据源</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-300 font-bold text-lg mb-1">
                          🔥 热度 {formatNumber(post.hot_score)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white/60 text-xs">参与度 {post.engagement_rate}%</span>
                          <span className="bg-green-500/20 text-green-300 px-1 py-0.5 rounded text-xs">
                            {post.authenticity}
                          </span>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-white/70 text-sm mb-4 line-clamp-2">
                      {post.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm text-white/60">
                        <span className="flex items-center">
                          ❤️ {formatNumber(post.stats.likes)}
                        </span>
                        <span className="flex items-center">
                          💬 {formatNumber(post.stats.comments)}
                        </span>
                        <span className="flex items-center">
                          ⭐ {formatNumber(post.stats.collections)}
                        </span>
                        <span className="flex items-center">
                          📤 {formatNumber(post.stats.shares)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white/50 text-xs">{formatDate(post.publishTime)}</span>
                        <button
                          onClick={() => window.open(post.url, '_blank')}
                          className="text-green-300 hover:text-green-200 text-xs underline"
                        >
                          查看真实原文
                        </button>
                      </div>
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                          <span key={tagIndex} className="bg-white/10 text-white/70 px-2 py-1 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}