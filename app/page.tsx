'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import LoginModal from './components/LoginModal'
import XiaohongshuProfileModal from './components/XiaohongshuProfileModal'
import { useAuth } from './contexts/AuthContext'

import GlobalUserMenu from './components/GlobalUserMenu'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, login } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  // 检查URL参数是否需要打开登录模态框
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('login') === 'true') {
      setShowLoginModal(true)
      // 清除URL参数
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // 检查认证并导航
  const handleNavigation = (path: string) => {
    if (path === '/profile' || path === '/generate') {
      // 这两个页面需要认证
      if (isAuthenticated) {
        router.push(path)
        return
      }
      
      // 检查是否有保存的凭证
      const lastCredentials = localStorage.getItem('lastCredentials')
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
        // 使用AuthContext的login方法
        login(result.user)
        
        // 保存凭证用于自动登录
        localStorage.setItem('lastCredentials', JSON.stringify({
          student_id: studentId,
          password: password
        }))
        
        setShowLoginModal(false)
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

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* 全局用户菜单 - 左上角 */}
      <GlobalUserMenu className="absolute top-6 left-6 z-50" />

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
          <div className="glass-effect p-8 text-center floating-card group cursor-pointer flex flex-col">
            <div className="text-5xl mb-6 breathing-glow">🧑‍💼</div>
            <h3 className="text-xl font-bold text-white mb-4 gradient-text">个人IP资料库</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed flex-grow">
              设定你的人设定位、内容关键词和90天愿景，建立专属的AI创作基因。通过详细的个人信息录入，为后续的内容生成提供精准的个性化参数。
            </p>
            <button
              onClick={() => handleNavigation('/profile')}
              className="inline-block cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              启航设置 ✨
            </button>
          </div>

          <div className="glass-effect p-8 text-center floating-card group cursor-pointer flex flex-col">
            <div className="text-5xl mb-6 breathing-glow">🤖</div>
            <h3 className="text-xl font-bold text-white mb-4 gradient-text">AI灵感引擎</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed flex-grow">
              基于你的人设，AI生成高质量小红书内容模板，并智能搜索相关爆款内容。一站式创作工具，从模板生成到热门搜索，让创意如星河般闪耀。
            </p>
            <button
              onClick={() => handleNavigation('/generate')}
              className="inline-block cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              智慧生成 🚀
            </button>
          </div>

          <div className="glass-effect p-8 text-center floating-card group cursor-pointer flex flex-col">
            <div className="text-5xl mb-6 breathing-glow">📝</div>
            <h3 className="text-xl font-bold text-white mb-4 gradient-text">作业系统</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed flex-grow">
              智能化作业提交与批改平台，AI助力学习进度追踪。提交创作作品，获得专业点评反馈，系统化提升内容创作能力。
            </p>
            <button
              onClick={() => handleNavigation('/homework')}
              className="inline-block cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              提交作业 📚
            </button>
          </div>

          <div className="glass-effect p-8 text-center floating-card group cursor-pointer flex flex-col">
            <div className="text-5xl mb-6 breathing-glow">📊</div>
            <h3 className="text-xl font-bold text-white mb-4 gradient-text">打卡中心</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed flex-grow">
              提交小红书链接，追踪你的创作进度，每一步都是星座的轨迹。通过智能日历热力图直观显示打卡记录，统计发布频率和互动数据。
            </p>
            <button
              onClick={() => handleNavigation('/dashboard')}
              className="inline-block cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              进度追踪 📈
            </button>
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="glass-effect inline-block p-6 rounded-2xl fade-in-up" style={{animationDelay: '0.8s'}}>
            <p className="text-white/80 text-lg">
              🌌 &ldquo;科技连接宇宙智慧，每一个创作者都是闪耀的星辰&rdquo;
            </p>
          </div>
          
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
      
    </div>
  )
}