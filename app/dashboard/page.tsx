'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import ComingSoon from '../components/ComingSoon'
import LoginModal from '../components/LoginModal'
import XiaohongshuProfileModal from '../components/XiaohongshuProfileModal'

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
  const [isLoading, setIsLoading] = useState(true)

  // 检查登录状态和小红书绑定状态
  useEffect(() => {
    checkAuthAndXiaohongshuStatus()
  }, [])

  const checkAuthAndXiaohongshuStatus = async () => {
    try {
      const userSession = localStorage.getItem('userSession')
      const lastCredentials = localStorage.getItem('lastCredentials')
      
      if (userSession) {
        try {
          const { student_id, isAuthenticated } = JSON.parse(userSession)
          if (isAuthenticated && student_id) {
            setIsLoggedIn(true)
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
  }

  const checkXiaohongshuProfile = async (studentId: string) => {
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
      
      // 如果没有绑定小红书链接，显示绑定弹窗
      if (!profileUrl) {
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

  if (!isLoggedIn || !currentXiaohongshuUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-6">📊</div>
          <h1 className="text-3xl font-bold gradient-text mb-4">打卡中心</h1>
          <p className="text-white/60 mb-8">
            {!isLoggedIn ? '需要登录后才能访问打卡中心' : '需要绑定小红书主页后才能使用打卡功能'}
          </p>
        </div>
        
        {/* 登录模态框 */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => router.push('/')}
          onLogin={handleLogin}
          loading={authLoading}
        />
        
        {/* 小红书主页绑定模态框 */}
        <XiaohongshuProfileModal
          isOpen={showXiaohongshuModal}
          onClose={() => router.push('/')}
          onUpdate={handleUpdateXiaohongshuProfile}
          currentUrl={currentXiaohongshuUrl}
          loading={profileLoading}
        />
      </div>
    )
  }

  return (
    <ComingSoon 
      title="自动化打卡与进度可视系统"
      description="智能追踪你的创作进度，让每一步都成为星座的轨迹。通过日历热力图直观显示打卡记录，统计发布频率和互动数据，见证你的成长历程。"
      icon="📊"
    />
  )
}