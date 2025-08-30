'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GlobalUserMenu from '../components/GlobalUserMenu'

export default function CheckinPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [userName, setUserName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // 检查认证状态
  useEffect(() => {
    const userSession = localStorage.getItem('userSession')
    if (userSession) {
      try {
        const { student_id, name, isAuthenticated } = JSON.parse(userSession)
        if (isAuthenticated) {
          setIsAuthenticated(true)
          setStudentId(student_id)
          setUserName(name || '')
        } else {
          router.push('/profile')
        }
      } catch {
        router.push('/profile')
      }
    } else {
      router.push('/profile')
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-white/80">正在验证身份...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <p className="text-white/80">需要登录后才能访问打卡中心</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* 全局用户菜单 - 左上角 */}
      <GlobalUserMenu className="absolute top-6 left-6 z-50" />

      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-effect p-12 rounded-3xl border border-white/20 backdrop-blur-lg">
            <div className="text-8xl mb-8 animate-pulse">📊</div>
            <h1 className="text-4xl font-bold gradient-text mb-6">打卡中心</h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              90天打卡挑战，坚持就是胜利！
            </p>
            
            {/* 用户信息显示 */}
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
              <h3 className="text-white font-medium mb-2 flex items-center justify-center">
                <span className="mr-2">👤</span>
                欢迎 {userName}
              </h3>
              <p className="text-white/70 text-sm">
                学号：{studentId}
              </p>
            </div>
            
            <div className="space-y-4 text-white/60">
              <p className="text-lg">🚀 打卡功能正在开发中，敬请期待~</p>
              <p className="text-sm">我们正在全力以赴为您打造更完美的体验</p>
            </div>

            {/* 按钮组 */}
            <div className="mt-8 space-y-4">
              {/* 返回打卡系统按钮 */}
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                📊 返回打卡系统
              </button>

              {/* 返回首页按钮 */}
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🏠 回到首页
              </button>
            </div>
            
            {/* 动效装饰 */}
            <div className="mt-8 flex justify-center space-x-4">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
