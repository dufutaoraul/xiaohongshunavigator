'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PasswordChangeModal from './PasswordChangeModal'

interface GlobalUserMenuProps {
  className?: string
}

export default function GlobalUserMenu({ className = '' }: GlobalUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [userInfo, setUserInfo] = useState<{
    student_id: string
    name: string
    isAuthenticated: boolean
    role?: string
  } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 获取用户信息
  useEffect(() => {
    const checkUserSession = async () => {
      const userSession = localStorage.getItem('userSession')
      if (userSession) {
        try {
          const session = JSON.parse(userSession)
          if (session.isAuthenticated && session.student_id) {
            // 验证会话是否仍然有效，并获取最新的role信息
            try {
              const response = await fetch(`/api/user?student_id=${session.student_id}`)
              if (response.ok) {
                const userData = await response.json()
                // 使用最新的role信息，避免缓存问题
                const latestRole = userData?.role || 'student'
                
                console.log('🔍 实时权限检查:', {
                  studentId: session.student_id,
                  cachedRole: session.role,
                  latestRole: latestRole,
                  isAdmin: latestRole === 'admin'
                })
                
                setUserInfo({
                  student_id: session.student_id,
                  name: session.name,
                  isAuthenticated: true,
                  role: latestRole // 使用从数据库获取的最新role
                })
                
                // 如果role发生变化，更新localStorage
                if (session.role !== latestRole) {
                  const updatedSession = { ...session, role: latestRole }
                  localStorage.setItem('userSession', JSON.stringify(updatedSession))
                  console.log('🔄 更新localStorage中的role信息:', latestRole)
                }
              } else {
                // API调用失败，使用缓存的信息
                setUserInfo({
                  student_id: session.student_id,
                  name: session.name,
                  isAuthenticated: true,
                  role: session.role || 'student'
                })
              }
            } catch (apiError) {
              console.error('API调用失败，使用缓存信息:', apiError)
              // API调用失败，使用缓存的信息
              setUserInfo({
                student_id: session.student_id,
                name: session.name,
                isAuthenticated: true,
                role: session.role || 'student'
              })
            }
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
    
    // 定期检查用户状态和权限（每30秒检查一次，避免过于频繁）
    const interval = setInterval(checkUserSession, 30000)
    
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
    // 调用全局函数打开登录模态框
    if ((window as any).openLoginModal) {
      ;(window as any).openLoginModal()
    } else {
      router.push('/?login=true')
    }
  }

  // 修改密码
  const handleChangePassword = async (newPassword: string): Promise<boolean> => {
    try {
      // 获取当前密码（初始密码通常是学号）
      const currentPassword = userInfo?.student_id || ''
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'change_password',
          student_id: userInfo?.student_id,
          password: currentPassword, // 添加当前密码用于验证
          new_password: newPassword
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        console.error('密码修改失败:', result.error)
      }
      
      return result.success
    } catch (error) {
      console.error('修改密码失败:', error)
      return false
    }
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
                setShowPasswordModal(true)
              }}
              className="w-full px-4 py-2 text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
              </svg>
              <span>修改密码</span>
            </button>

            {/* 管理员专用功能 */}
            {userInfo.role === 'admin' && (
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/admin')
                }}
                className="w-full px-4 py-2 text-left text-orange-300 hover:text-orange-200 hover:bg-orange-500/10 transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>后台管理</span>
              </button>
            )}
            
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
      
      {/* 密码修改模态框 */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onChangePassword={handleChangePassword}
        studentId={userInfo?.student_id || ''}
        currentPassword={userInfo?.student_id || ''}
      />
    </div>
  )
}
