'use client'

import { useState } from 'react'

export default function SimpleTestPage() {
  const [userUrl, setUserUrl] = useState('https://www.xiaohongshu.com/user/profile/5ff0e4ac000000000100d1b4')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const testCrawl = async () => {
    if (!userUrl.trim()) {
      setError('请输入小红书用户主页链接')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/simple-crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userUrl: userUrl.trim() })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || '抓取失败')
      }
    } catch (err: any) {
      setError(`请求失败: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🎯 最简单的小红书抓取测试</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">输入小红书用户主页链接</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              用户主页链接:
            </label>
            <input
              type="text"
              value={userUrl}
              onChange={(e) => setUserUrl(e.target.value)}
              placeholder="https://www.xiaohongshu.com/user/profile/用户ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={testCrawl}
            disabled={loading}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? '抓取中...' : '开始抓取'}
          </button>
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">❌ 抓取失败</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 成功结果显示 */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-green-800 font-semibold mb-4">✅ 抓取成功！</h3>
          
          <div className="mb-6">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">👤 用户信息</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-700">
                    <strong>昵称:</strong> {result.userInfo?.nickname}
                  </p>
                  <p className="text-gray-700">
                    <strong>简介:</strong> {result.userInfo?.desc}
                  </p>
                </div>
                <div>
                  <p className="text-gray-700">
                    <strong>关注:</strong> {result.userInfo?.follows}
                  </p>
                  <p className="text-gray-700">
                    <strong>粉丝:</strong> {result.userInfo?.fans}
                  </p>
                  <p className="text-gray-700">
                    <strong>获赞:</strong> {result.userInfo?.interaction}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-700">
              <strong>用户ID:</strong> {result.userId}
            </p>
            <p className="text-gray-700">
              <strong>总帖子数:</strong> {result.totalPosts}
            </p>
            <p className="text-green-700 font-medium">
              <strong>✅ {result.message}</strong>
            </p>
          </div>

          <h4 className="text-lg font-semibold mb-3">🏆 热度排名前三的帖子:</h4>
          
          <div className="space-y-4">
            {result.topPosts.map((post: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-2">
                      #{index + 1} {post.title}
                    </h5>
                    
                    <div className="flex space-x-4 text-sm text-gray-600 mb-3">
                      <span>👍 {post.likes} 点赞</span>
                      <span>💬 {post.comments} 评论</span>
                      <span>⭐ {post.collections} 收藏</span>
                      <span className="font-semibold text-blue-600">
                        🔥 热度: {post.hotScore}
                      </span>
                    </div>
                    
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      查看帖子 →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-gray-50 p-6 rounded-lg mt-6">
        <h3 className="text-lg font-semibold mb-3">📋 使用说明</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>输入任意小红书用户的主页链接</li>
          <li>系统会自动抓取该用户的帖子数据</li>
          <li>按照热度排序，返回前三名帖子</li>
          <li>热度计算：点赞×1 + 评论×3 + 收藏×5</li>
          <li>点击"查看帖子"可以直接访问原帖</li>
        </ul>
      </div>
    </div>
  )
}
