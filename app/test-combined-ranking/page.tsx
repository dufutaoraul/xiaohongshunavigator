'use client'

import { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'

export default function TestCombinedRanking() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')

  const runCombinedRanking = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/xhs/combined-student-ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 10,
          force_refresh: false
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setResults(result.data)
      } else {
        setError(result.error || '综合排名分析失败')
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
      'mcp': { bg: 'bg-green-500/20', text: 'text-green-300', label: '真实数据' },
      'mock': { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: '高质量模拟' },
      'error': { bg: 'bg-red-500/20', text: 'text-red-300', label: '获取失败' }
    }
    const badge = badges[source] || badges.mock
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
            🏆 所有学员综合TOP10热门帖子排名
          </h1>
          <p className="text-xl text-white/80">
            聚合所有学员的帖子数据，基于多维度算法进行综合排名
          </p>
        </div>

        <Card title="综合排名分析" icon="📊" className="mb-8">
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold mb-2">🎯 排名算法说明：</h4>
              <ul className="text-blue-200/80 text-sm space-y-1">
                <li>• <strong>综合权重</strong>：点赞30% + 评论35% + 收藏25% + 分享10%</li>
                <li>• <strong>时间加分</strong>：新发布的帖子获得时新性加成（30天内）</li>
                <li>• <strong>互动质量</strong>：评论和分享比例高的帖子获得额外加分</li>
                <li>• <strong>多学员聚合</strong>：从所有学员的帖子中选出最优秀的TOP10</li>
              </ul>
            </div>

            <Button onClick={runCombinedRanking} disabled={loading} className="w-full">
              {loading ? '🔄 正在分析所有学员数据...' : '🚀 开始综合排名分析'}
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
            {/* 统计概览 */}
            <Card title="分析概览" icon="📈" className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-300">{results.stats.total_posts}</div>
                  <div className="text-purple-200/80 text-sm">总帖子数</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-300">{results.stats.active_students}/{results.stats.total_students}</div>
                  <div className="text-blue-200/80 text-sm">活跃学员</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-300">{results.stats.real_data_students}</div>
                  <div className="text-green-200/80 text-sm">真实数据源</div>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-300">{results.stats.avg_posts_per_student}</div>
                  <div className="text-yellow-200/80 text-sm">平均帖子数</div>
                </div>
              </div>

              {results.stats.top_student && (
                <div className="mt-4 bg-gold/10 border border-gold/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-gold font-semibold">🌟 本期表现最佳学员</h4>
                      <p className="text-white/80">{results.stats.top_student.student.name} - {results.stats.top_student.student.specialty}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-gold font-bold">{results.stats.top_student.posts_count} 篇帖子</div>
                      <div className="text-gold/80 text-sm">平均参与度 {results.stats.top_student.avg_engagement}%</div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* TOP10排名 */}
            <Card title="🏆 综合TOP10热门帖子" icon="🔥" className="mb-8">
              <div className="space-y-4">
                {results.top_posts.map((post: any, index: number) => (
                  <div key={post.id} className={`bg-gradient-to-r p-6 rounded-lg border ${
                    index === 0 ? 'from-gold/10 to-yellow-500/10 border-gold/30' :
                    index === 1 ? 'from-gray-400/10 to-gray-500/10 border-gray-400/30' :
                    index === 2 ? 'from-orange-500/10 to-orange-600/10 border-orange-400/30' :
                    'from-purple-500/5 to-pink-500/5 border-white/10'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
                          index === 0 ? 'bg-gradient-to-r from-gold to-yellow-500' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                          index === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}>
                          {post.ranking}
                        </div>
                        <div>
                          <div className="text-white font-medium">{post.author.nickname}</div>
                          <div className="text-white/60 text-sm">{post.author.specialty}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-purple-300 font-bold text-lg mb-1">
                          热度 {formatNumber(post.popularity_score)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white/60 text-xs">质量 {post.quality_score}</span>
                          {post.recency_bonus > 0 && (
                            <span className="text-green-300 text-xs">+{post.recency_bonus}% 时新</span>
                          )}
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
                        <span className="text-xs">
                          参与度 {post.engagement_rate}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white/50 text-xs">{formatDate(post.publishTime)}</span>
                        <button
                          onClick={() => window.open(post.url, '_blank')}
                          className="text-purple-300 hover:text-purple-200 text-xs underline"
                        >
                          查看原文
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 学员表现概览 */}
            <Card title="学员表现概览" icon="👥" className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.student_summary.map((student: any, index: number) => (
                  <div key={student.name} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-white font-medium">{student.name}</h4>
                        <p className="text-white/60 text-sm">{student.specialty}</p>
                      </div>
                      {getSourceBadge(student.source)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="space-y-1">
                        <div className="text-white/80">{student.posts_count} 篇帖子</div>
                        <div className="text-white/60">{formatNumber(student.followers)} 关注者</div>
                      </div>
                      <div className="text-right">
                        <div className="text-purple-300 font-medium">{student.avg_engagement}%</div>
                        <div className="text-white/60 text-xs">平均参与度</div>
                      </div>
                    </div>
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