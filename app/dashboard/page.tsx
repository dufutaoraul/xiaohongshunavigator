'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import ComingSoon from '../components/ComingSoon'
import LoginModal from '../components/LoginModal'
import XiaohongshuProfileModal from '../components/XiaohongshuProfileModal'

import GlobalUserMenu from '../components/GlobalUserMenu'

// 创建Supabase客户端 - 添加环境变量检查
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
)

export default function DashboardPage() {
  const router = useRouter()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showXiaohongshuModal, setShowXiaohongshuModal] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [currentXiaohongshuUrl, setCurrentXiaohongshuUrl] = useState('')
  const [currentStudentId, setCurrentStudentId] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 检查登录状态和小红书绑定状态
  useEffect(() => {
    checkAuthAndXiaohongshuStatus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuthAndXiaohongshuStatus = useCallback(async () => {
    try {
      const userSession = localStorage.getItem('userSession')
      const lastCredentials = localStorage.getItem('lastCredentials')
      
      if (userSession) {
        try {
          const { student_id, isAuthenticated: authStatus } = JSON.parse(userSession)
          if (authStatus && student_id) {
            setIsLoggedIn(true)
            setIsAuthenticated(true)
            setCurrentStudentId(student_id)
            
            // 检查是否已绑定小红书链接
            await checkXiaohongshuProfile(student_id)
            return
          }
        } catch {
          // 忽略解析错误
        }
      }
      
      // 如果有保存的凭证，尝试自动登录
      if (lastCredentials) {
        try {
          const { student_id, password } = JSON.parse(lastCredentials)
          const loginSuccess = await handleLogin(student_id, password)
          if (!loginSuccess) {
            setShowLoginModal(true)
          }
        } catch {
          setShowLoginModal(true)
        }
      } else {
        setShowLoginModal(true)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setShowLoginModal(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const checkXiaohongshuProfile = async (studentId: string, forceShow = false) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('xiaohongshu_profile_url')
        .eq('student_id', studentId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      const profileUrl = data?.xiaohongshu_profile_url
      setCurrentXiaohongshuUrl(profileUrl || '')
      
      // 如果没有绑定小红书链接，或者强制显示，显示绑定弹窗
      if (!profileUrl || forceShow) {
        setShowXiaohongshuModal(true)
      }
    } catch (error) {
      console.error('Error checking xiaohongshu profile:', error)
    }
  }

  // 登录处理
  const handleLogin = async (studentId: string, password: string): Promise<boolean> => {
    setAuthLoading(true)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          student_id: studentId,
          password: password
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // 保存认证状态
        localStorage.setItem('userSession', JSON.stringify({
          student_id: studentId,
          name: result.user.name,
          isAuthenticated: true
        }))
        
        localStorage.setItem('lastCredentials', JSON.stringify({
          student_id: studentId,
          password: password
        }))
        
        setIsLoggedIn(true)
        setIsAuthenticated(true)
        setCurrentStudentId(studentId)
        setShowLoginModal(false)
        
        // 检查小红书绑定状态
        await checkXiaohongshuProfile(studentId)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setAuthLoading(false)
    }
  }

  // 更新小红书主页链接
  const handleUpdateXiaohongshuProfile = async (url: string): Promise<boolean> => {
    if (!currentStudentId) return false
    
    setProfileLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ xiaohongshu_profile_url: url })
        .eq('student_id', currentStudentId)

      if (error) {
        console.error('Error updating xiaohongshu profile:', error)
        return false
      }

      setCurrentXiaohongshuUrl(url)
      setShowXiaohongshuModal(false)
      return true
    } catch (error) {
      console.error('Error updating profile:', error)
      return false
    } finally {
      setProfileLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">正在检查登录状态...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-6">📊</div>
          <h1 className="text-3xl font-bold gradient-text mb-4">打卡中心</h1>
          <p className="text-white/60 mb-8">
            需要登录后才能访问打卡中心
          </p>
        </div>

        {/* 登录模态框 */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => router.push('/')}
          onLogin={handleLogin}
          loading={authLoading}
        />

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
          <h1 className="text-4xl font-bold gradient-text mb-6">自动化打卡与进度可视系统</h1>
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            智能追踪你的创作进度，让每一步都成为星座的轨迹。通过日历热力图直观显示打卡记录，统计发布频率和互动数据，见证你的成长历程。
          </p>
          
          {/* 小红书主页链接信息 */}
          {currentXiaohongshuUrl ? (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
              <h3 className="text-white font-medium mb-2 flex items-center justify-center">
                <span className="mr-2">🔗</span>
                已绑定小红书主页
              </h3>
              <p className="text-white/70 text-sm break-all">
                {currentXiaohongshuUrl}
              </p>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-orange-500/10 border border-orange-400/30 rounded-lg">
              <h3 className="text-white font-medium mb-2 flex items-center justify-center">
                <span className="mr-2">⚠️</span>
                尚未绑定小红书主页
              </h3>
              <p className="text-orange-200/70 text-sm">
                请先绑定您的小红书主页链接，以便使用打卡功能
              </p>
            </div>
          )}
          
          {isAuthenticated ? (
            <div className="space-y-4 text-white/60">
              <p className="text-lg">📊 打卡中心已上线！</p>
              <p className="text-sm">90天打卡挑战，坚持就是胜利</p>
            </div>
          ) : (
            <div className="space-y-4 text-white/60">
              <p className="text-lg">🚀 此功能正在研发中，敬请期待~</p>
              <p className="text-sm">我们正在全力以赴为您打造更完美的体验</p>
            </div>
          )}

          {/* 按钮组 */}
          <div className="mt-8 space-y-4">
            {/* 打卡中心按钮 - 所有登录用户都可见 */}
            {isAuthenticated && (
              <button
                onClick={() => router.push('/checkin')}
                className={`w-full px-6 py-3 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  currentXiaohongshuUrl
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                }`}
              >
                {currentXiaohongshuUrl ? '📊 进入打卡中心' : '📊 进入打卡中心（需先绑定主页）'}
              </button>
            )}

            {/* 绑定/修改小红书链接按钮 */}
            <button
              onClick={() => {
                checkXiaohongshuProfile(currentStudentId, true)
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {currentXiaohongshuUrl ? '🔗 修改我的小红书主页链接' : '🔗 绑定我的小红书主页链接'}
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
      
      {/* 小红书主页绑定模态框 */}
      <XiaohongshuProfileModal
        isOpen={showXiaohongshuModal}
        onClose={() => setShowXiaohongshuModal(false)}
        onUpdate={handleUpdateXiaohongshuProfile}
        currentUrl={currentXiaohongshuUrl}
        loading={profileLoading}
      />
    </div>
  )
}