'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface GlobalUserMenuProps {
  className?: string
}

export default function GlobalUserMenu({ className = '' }: GlobalUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<{
    student_id: string
    name: string
    isAuthenticated: boolean
  } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 获取用户信息
  useEffect(() => {
    const checkUserSession = () => {
      const userSession = localStorage.getItem('userSession')
      if (userSession) {
        try {
          const session = JSON.parse(userSession)
          if (session.isAuthenticated) {
            setUserInfo({
              student_id: session.student_id,
              name: session.name,
              isAuthenticated: true
            })
          } else {
            setUserInfo({ student_id: '', name: '', isAuthenticated: false })
          }
        } catch {
          setUserInfo({ student_id: '', name: '', isAuthenticated: false })
        }
      } else {
        setUserInfo({ student_id: '', name: '', isAuthenticated: false })
      }
    }

    checkUserSession()
    
    // 监听存储变化
    const handleStorageChange = () => {
      checkUserSession()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // 定期检查用户状态
    const interval = setInterval(checkUserSession, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('userSession')
    localStorage.removeItem('lastCredentials')
    setUserInfo({ student_id: '', name: '', isAuthenticated: false })
    setIsOpen(false)
    router.push('/')
    // 刷新页面确保状态重置
    window.location.reload()
  }

  // 登录
  const handleLogin = () => {
    router.push('/')
  }

  if (!userInfo) {
    return (
      <div className={`${className}`}>
        <div className="px-4 py-2 bg-white/10 rounded-lg border border-white/20">
          <span className="text-white/60 text-sm">加载中...</span>
        </div>
      </div>
    )
  }

  if (!userInfo.isAuthenticated) {
    return (
      <div className={`${className}`}>
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-400/30 text-blue-300 hover:text-blue-200 transition-colors text-sm"
        >
          未登录 - 点击登录
        </button>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* 用户信息显示 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all duration-300"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {userInfo.name?.charAt(0) || userInfo.student_id?.charAt(0) || 'U'}
        </div>
        <div className="text-left">
          <div className="text-white text-sm font-medium">
            {userInfo.name || '学员'}
          </div>
          <div className="text-white/60 text-xs">
            {userInfo.student_id}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-white/10">
            <div className="text-white font-medium">{userInfo.name || '学员'}</div>
            <div className="text-white/60 text-sm">{userInfo.student_id}</div>
          </div>
          
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false)
                router.push('/profile')
              }}
              className="w-full px-4 py-2 text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>修改资料</span>
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false)
                router.push('/dashboard')
              }}
              className="w-full px-4 py-2 text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>打卡中心</span>
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false)
                // TODO: 添加修改密码功能
                alert('修改密码功能开发中...')
              }}
              className="w-full px-4 py-2 text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>修改密码</span>
            </button>
            
            <div className="border-t border-white/10 my-2"></div>
            
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>退出登录</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
