'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import LoginModal from './components/LoginModal'
import XiaohongshuProfileModal from './components/XiaohongshuProfileModal'
import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const router = useRouter()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showXiaohongshuModal, setShowXiaohongshuModal] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [currentXiaohongshuUrl, setCurrentXiaohongshuUrl] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentStudentId, setCurrentStudentId] = useState('')

  // 检查登录状态
  useEffect(() => {
    const userSession = localStorage.getItem('userSession')
    if (userSession) {
      try {
        const { student_id, isAuthenticated } = JSON.parse(userSession)
        if (isAuthenticated && student_id) {
          setIsLoggedIn(true)
          setCurrentStudentId(student_id)
          
          // 延迟显示小红书绑定弹窗，让页面先完全加载
          setTimeout(() => {
            checkAndShowXiaohongshuModal(student_id)
          }, 1000)
        }
      } catch {
        // 忽略解析错误
      }
    }
  }, [])

  // 检查并显示小红书绑定弹窗
  const checkAndShowXiaohongshuModal = async (studentId: string) => {
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

      setCurrentXiaohongshuUrl(data?.xiaohongshu_profile_url || '')
      setShowXiaohongshuModal(true)
    } catch (error) {
      console.error('Error checking xiaohongshu profile:', error)
    }
  }

  // 检查认证并导航
  const handleNavigation = (path: string) => {
    const userSession = localStorage.getItem('userSession')
    const lastCredentials = localStorage.getItem('lastCredentials')
    
    if (path === '/profile' || path === '/generate') {
      // 这两个页面需要认证
      if (userSession) {
        try {
          const { isAuthenticated } = JSON.parse(userSession)
          if (isAuthenticated) {
            router.push(path)
            return
          }
        } catch {
          // 忽略解析错误
        }
      }
      
      // 如果有保存的凭证，直接跳转到对应页面（会触发登录）
      if (lastCredentials) {
        router.push(path)
      } else {
        // 没有保存的凭证，显示登录模态框
        setShowLoginModal(true)
      }
    } else {
      // 其他页面直接跳转
      router.push(path)
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
        
        // 登录成功后显示小红书绑定弹窗
        setTimeout(() => {
          checkAndShowXiaohongshuModal(studentId)
        }, 500)
        
        router.push('/profile')
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
      return true
    } catch (error) {
      console.error('Error updating profile:', error)
      return false
    } finally {
      setProfileLoading(false)
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold gradient-text mb-8 fade-in-up">
            🌟 小红书AI灵感领航员
          </h1>
          <p className="text-2xl text-white/80 mb-4 fade-in-up" style={{animationDelay: '0.2s'}}>
            探索AI智慧的宇宙，点亮创作的星火
          </p>
          <p className="text-lg text-white/60 mb-12 fade-in-up" style={{animationDelay: '0.4s'}}>
            为爱学AI创富营学员打造的一体化IP孵化工具
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="glass-effect p-8 text-center floating-card group cursor-pointer">
            <div className="text-5xl mb-6 breathing-glow">🧑‍💼</div>
            <h3 className="text-xl font-bold text-white mb-4 gradient-text">个人IP资料库</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              设定你的人设定位、内容关键词和90天愿景，建立专属的AI创作基因。通过详细的个人信息录入，为后续的内容生成提供精准的个性化参数。
              {isLoggedIn && (
                <span className="block mt-2 text-blue-300 text-xs">
                  ✨ 已登录，点击 <Link href="/profile" className="text-blue-400 hover:text-blue-300 underline">个人资料</Link> 页面管理信息
                </span>
              )}
            </p>
            <button
              onClick={() => handleNavigation('/profile')}
              className="inline-block cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              启航设置 ✨
            </button>
          </div>

          <div className="glass-effect p-8 text-center floating-card group cursor-pointer">
            <div className="text-5xl mb-6 breathing-glow">🤖</div>
            <h3 className="text-xl font-bold text-white mb-4 gradient-text">AI灵感引擎</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              基于你的人设，AI生成高质量小红书内容，让创意如星河般闪耀。智能分析你的特色定位，自动生成吸引人的标题和正文内容。
            </p>
            <button
              onClick={() => handleNavigation('/generate')}
              className="inline-block cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              智慧生成 🚀
            </button>
          </div>

          <div className="glass-effect p-8 text-center floating-card group cursor-pointer">
            <div className="text-5xl mb-6 breathing-glow">📊</div>
            <h3 className="text-xl font-bold text-white mb-4 gradient-text">打卡中心</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              提交小红书链接，追踪你的创作进度，每一步都是星座的轨迹。通过智能日历热力图直观显示打卡记录，统计发布频率和互动数据。
            </p>
            <button
              onClick={() => handleNavigation('/dashboard')}
              className="inline-block cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              进度追踪 📈
            </button>
          </div>

          <div className="glass-effect p-8 text-center floating-card group cursor-pointer">
            <div className="text-5xl mb-6 breathing-glow">🏆</div>
            <h3 className="text-xl font-bold text-white mb-4 gradient-text">优秀案例</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              学习优秀学员的爆款内容和经验，在星光指引下前行。精选创富营内最具影响力的成功案例，深度解析爆款内容的创作技巧。
            </p>
            <button
              onClick={() => handleNavigation('/showcase')}
              className="inline-block cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              灵感探索 🌠
            </button>
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="glass-effect inline-block p-6 rounded-2xl fade-in-up" style={{animationDelay: '0.8s'}}>
            <p className="text-white/80 text-lg">
              🌌 &ldquo;科技连接宇宙智慧，每一个创作者都是闪耀的星辰&rdquo;
            </p>
          </div>
          
          {/* 小红书主页修改按钮 */}
          {isLoggedIn && (
            <div className="mt-6">
              <button
                onClick={() => {
                  checkAndShowXiaohongshuModal(currentStudentId)
                }}
                className="text-sm text-white/60 hover:text-white/80 transition-colors duration-300 px-4 py-2 border border-white/30 hover:border-white/50 rounded-lg"
              >
                🔗 修改我的小红书主页链接
              </button>
            </div>
          )}
        </div>

        {/* 调试入口 - 仅开发环境显示 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-center mt-8">
            <Link 
              href="/debug" 
              className="text-white/40 hover:text-white/60 text-sm transition-colors duration-300"
            >
              🔍 调试面板
            </Link>
          </div>
        )}
      </div>
      
      {/* 登录模态框 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        loading={authLoading}
      />
      
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