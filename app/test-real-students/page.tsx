'use client'

import { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'

export default function TestRealStudents() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')

  const fetchRealStudentsData = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/xhs/real-students-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setResults(result.data)
      } else {
        setError(result.error || '获取真实学员数据失败')
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
      'mcp_real': { bg: 'bg-green-500/20', text: 'text-green-300', label: '🔥 MCP真实抓取' },
      'web_scrape_real': { bg: 'bg-blue-500/20', text: 'text-blue-300', label: '🌐 网页真实抓取' },
      'error': { bg: 'bg-red-500/20', text: 'text-red-300', label: '❌ 抓取失败' }
    }
    const badge = badges[source] || badges.web_scrape_real
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
            👥 真实学员小红书数据抓取
          </h1>
          <p className="text-xl text-white/80">
            从数据库获取AXCF202501开头学员的真实小红书数据
          </p>
        </div>

        <Card title="数据库学员抓取" icon="🎯" className="mb-8">
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
              <h4 className="text-green-300 font-semibold mb-2">✅ 数据来源保证：</h4>
              <ul className="text-green-200/80 text-sm space-y-1">
                <li>• <strong>真实学员信息</strong>：从users表查询AXCF202501开头的学员</li>
                <li>• <strong>真实小红书链接</strong>：使用学员在数据库中的xiaohongshu_profile_url</li>
                <li>• <strong>MCP服务优先</strong>：尝试通过MCP服务获取真实帖子数据</li>
                <li>• <strong>备用抓取</strong>：MCP失败时使用网页抓取真实数据</li>
              </ul>
            </div>

            <Button onClick={fetchRealStudentsData} disabled={loading} className="w-full">
              {loading ? '🔄 正在抓取数据库学员数据...' : '🚀 开始抓取真实学员数据'}
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
                  <div className="text-2xl font-bold text-green-300">{results.database_students}</div>
                  <div className="text-green-200/80 text-sm">数据库学员数</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-300">{results.successful_scrapes}</div>
                  <div className="text-blue-200/80 text-sm">成功抓取学员</div>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-300">{results.total_real_posts}</div>
                  <div className="text-purple-200/80 text-sm">总真实帖子数</div>
                </div>
                <div className="bg-gold/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gold">{results.top_10_posts.length}</div>
                  <div className="text-gold/80 text-sm">TOP10排名</div>
                </div>
              </div>

              <div className="mt-4 bg-gold/10 border border-gold/30 rounded-lg p-3">
                <div className="text-gold font-semibold text-center">🎯 {results.data_authenticity}</div>
              </div>
            </Card>

            {/* 学员详情 */}
            <Card title="真实学员详情" icon="👥" className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.student_details.map((student: any, index: number) => (
                  <div key={student.student.student_id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-white font-medium">
                          {student.student.real_name || student.student.name}
                          <span className="text-white/60 text-sm ml-2">({student.student.student_id})</span>
                        </h4>
                        <p className="text-white/60 text-xs">{student.student.xiaohongshu_url}</p>
                      </div>
                      {getSourceBadge(student.source)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-white/80">帖子数: {student.posts_count}</div>
                      {student.error && (
                        <div className="text-red-300 text-xs max-w-48 truncate">{student.error}</div>
                      )}
                    </div>
                    {student.posts && student.posts.length > 0 && (
                      <div className="mt-2 text-xs text-white/50">
                        最新: {student.posts[0].title.substring(0, 30)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* TOP10热门排名 */}
            <Card title="🏆 真实学员综合TOP10" icon="🔥" className="mb-8">
              <div className="space-y-4">
                {results.top_10_posts.map((post: any, index: number) => (
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
                          <div className="text-white font-medium">{post.author.nickname || post.author.userId}</div>
                          <div className="text-white/60 text-sm">{post.author.userId}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-300 font-bold text-lg mb-1">
                          🔥 热度 {formatNumber(post.hot_score)}
                        </div>
                        <div className="text-white/60 text-xs">
                          参与度 {post.engagement_rate}%
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

                    <div className="mt-3 flex items-center justify-between">
                      <div className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                        真实学员: {post.author.userId}
                      </div>
                      <div className="text-white/50 text-xs">
                        数据源: {post.source}
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