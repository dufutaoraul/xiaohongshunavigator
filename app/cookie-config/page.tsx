'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CookieConfigPage() {
  const router = useRouter()
  const [cookie, setCookie] = useState('')
  const [cookieStatus, setCookieStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    checkCookieStatus()
  }, [])

  const checkCookieStatus = async () => {
    try {
      const response = await fetch('http://localhost:8002/cookie/status')
      const data = await response.json()
      setCookieStatus(data)
    } catch (error) {
      console.error('检查Cookie状态失败:', error)
    }
  }

  const updateCookie = async () => {
    if (!cookie.trim()) {
      alert('请输入Cookie')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:8002/cookie/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cookie: cookie.trim() })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Cookie更新成功！现在可以获取真实数据了。')
        setCookie('')
        await checkCookieStatus()
      } else {
        alert(`Cookie更新失败: ${data.message}`)
      }
    } catch (error) {
      alert('更新Cookie时发生错误')
      console.error('更新Cookie失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const testCurrentCookie = async () => {
    setTesting(true)
    try {
      await checkCookieStatus()
      alert('Cookie状态已刷新')
    } catch (error) {
      alert('测试Cookie失败')
    } finally {
      setTesting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-400'
      case 'invalid': return 'text-red-400'
      case 'no_cookie': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return '✅'
      case 'invalid': return '❌'
      case 'no_cookie': return '⚠️'
      default: return '❓'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* 头部导航 */}
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-300"
        >
          ← 返回首页
        </button>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">🍪</div>
            <h1 className="text-4xl font-bold text-white mb-4">Cookie 配置</h1>
            <p className="text-white/80 text-lg">
              配置小红书Cookie以获取真实数据
            </p>
          </div>

          {/* 当前状态 */}
          {cookieStatus && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-8">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <span className="mr-2">📊</span>
                当前状态
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Cookie状态:</span>
                  <span className={`font-medium ${getStatusColor(cookieStatus.status)}`}>
                    {getStatusIcon(cookieStatus.status)} {cookieStatus.message}
                  </span>
                </div>
                {cookieStatus.cookie_length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Cookie长度:</span>
                    <span className="text-white">{cookieStatus.cookie_length} 字符</span>
                  </div>
                )}
              </div>
              <button
                onClick={testCurrentCookie}
                disabled={testing}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg transition-all duration-300"
              >
                {testing ? '🔄 测试中...' : '🧪 重新测试'}
              </button>
            </div>
          )}

          {/* Cookie更新表单 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-8">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <span className="mr-2">🔧</span>
              更新Cookie
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  小红书Cookie:
                </label>
                <textarea
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder="请粘贴从小红书网站获取的完整Cookie..."
                  className="w-full h-32 px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 resize-none"
                />
              </div>
              
              <button
                onClick={updateCookie}
                disabled={loading || !cookie.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
              >
                {loading ? '🔄 更新中...' : '✅ 更新Cookie'}
              </button>
            </div>
          </div>

          {/* 获取Cookie指南 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-8">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <span className="mr-2">📖</span>
              如何获取Cookie
            </h3>

            <div className="space-y-4 text-white/80">
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                <p className="text-blue-300 font-medium mb-2">📚 详细教程</p>
                <p className="text-sm mb-3">
                  我们为您准备了详细的图文教程，包含完整的Cookie获取步骤和常见问题解答。
                </p>
                <a
                  href="https://tcnlkdeey4g8.feishu.cn/wiki/VvEmw2j33izxorkdUClck50en9b"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300"
                >
                  <span className="mr-2">🔗</span>
                  查看完整教程
                  <span className="ml-2">↗</span>
                </a>
              </div>

              <div className="text-sm">
                <p className="font-medium text-white mb-2">快速步骤概览：</p>
                <ul className="space-y-1 text-white/70">
                  <li>• 登录小红书网站 (xiaohongshu.com)</li>
                  <li>• 打开浏览器开发者工具 (F12)</li>
                  <li>• 在Network标签页中找到请求</li>
                  <li>• 复制请求头中的Cookie值</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 注意事项 */}
          <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-6">
            <h3 className="text-yellow-400 font-semibold mb-3 flex items-center">
              <span className="mr-2">⚠️</span>
              重要提醒
            </h3>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>• Cookie包含您的登录信息，请妥善保管</li>
              <li>• Cookie会定期过期，需要重新获取</li>
              <li>• 不要在公共场所或不安全的网络环境下操作</li>
              <li>• 如果遇到问题，请尝试重新登录小红书后获取新Cookie</li>
            </ul>
          </div>

          {/* 快速测试 */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/search')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-300"
            >
              🔍 前往搜索页面测试
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
