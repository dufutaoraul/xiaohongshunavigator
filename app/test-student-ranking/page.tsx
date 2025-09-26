'use client'

import { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'

export default function TestStudentRanking() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')

  // 示例学员数据（为了测试，只用少量）
  const [testStudents, setTestStudents] = useState([
    { name: '学员小张', url: 'https://www.xiaohongshu.com/user/profile/test1' },
    { name: '学员小李', url: 'https://www.xiaohongshu.com/user/profile/test2' },
    { name: '学员小王', url: 'https://www.xiaohongshu.com/user/profile/test3' }
  ])

  const runTest = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/xhs/student-top-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_profiles: testStudents,
          limit: 10,
          test_mode: true
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setResults(result.data)
      } else {
        setError(result.error || '测试失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold gradient-text mb-6">
            🏆 学员主页热门帖子排名测试
          </h1>
          <p className="text-xl text-white/80">
            测试从学员主页筛选前10热门帖子的功能（最小化抓取）
          </p>
        </div>

        <Card title="测试设置" icon="⚙️" className="mb-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-3">测试学员名单（最多3个）：</h3>
              {testStudents.map((student, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 p-3 rounded-lg mb-2">
                  <div>
                    <span className="text-white font-medium">{student.name}</span>
                    <span className="text-white/60 text-sm ml-2">{student.url}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
              <h4 className="text-yellow-300 font-semibold mb-2">⚠️ 测试限制：</h4>
              <ul className="text-yellow-200/80 text-sm space-y-1">
                <li>• 最多分析3个学员主页</li>
                <li>• 每个主页最多抓取20个帖子</li>
                <li>• 如果MCP服务不可用，将使用模拟数据</li>
                <li>• 按热门度算法排序（点赞40% + 评论30% + 收藏20% + 分享10%）</li>
              </ul>
            </div>

            <Button onClick={runTest} disabled={loading} className="w-full">
              {loading ? '🔄 正在分析学员主页...' : '🚀 开始测试排名功能'}
            </Button>

            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
                <div className="text-red-300">❌ {error}</div>
              </div>
            )}
          </div>
        </Card>

        {results && (
          <Card title="测试结果" icon="📊" className="mb-8">
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
                <h4 className="text-green-300 font-semibold mb-2">✅ 分析完成</h4>
                <div className="text-green-200/80 text-sm">
                  <p>分析时间：{new Date(results.analysis_time).toLocaleString()}</p>
                  <p>分析学员数：{results.students_analyzed}</p>
                  <p>测试模式：{results.test_mode ? '是' : '否'}</p>
                </div>
              </div>

              {results.results.map((studentResult: any, index: number) => (
                <div key={index} className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">
                      {studentResult.student.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-white/60">
                        总帖子: {studentResult.total_posts}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        studentResult.source === 'mcp' ? 'bg-green-500/20 text-green-300' :
                        studentResult.source === 'mock' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {studentResult.source === 'mcp' ? '真实数据' :
                         studentResult.source === 'mock' ? '模拟数据' : '获取失败'}
                      </span>
                    </div>
                  </div>

                  {studentResult.posts.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-white/80 font-semibold">🏆 热门帖子排名 TOP 10:</h4>
                      {studentResult.posts.slice(0, 10).map((post: any, postIndex: number) => (
                        <div key={postIndex} className="bg-black/20 rounded-lg p-4 border border-white/10">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-gradient-to-r from-gold to-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xs mr-3">
                                {postIndex + 1}
                              </div>
                              <h5 className="text-white font-medium text-sm">{post.title}</h5>
                            </div>
                            <div className="text-right">
                              <div className="text-purple-300 font-bold text-sm">
                                热门度: {post.popularity_score}
                              </div>
                              <div className="text-white/60 text-xs">
                                参与度: {post.engagement_rate}%
                              </div>
                            </div>
                          </div>

                          <p className="text-white/70 text-xs mb-3 line-clamp-2">
                            {post.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-white/60">
                              <span>❤️ {post.stats.likes}</span>
                              <span>💬 {post.stats.comments}</span>
                              <span>⭐ {post.stats.collections}</span>
                              <span>📤 {post.stats.shares}</span>
                            </div>
                            <div className="text-white/50 text-xs">
                              {new Date(post.publishTime).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/60 text-center py-4">
                      {studentResult.student.error ?
                        `获取失败: ${studentResult.student.error}` :
                        '没有找到帖子数据'
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}