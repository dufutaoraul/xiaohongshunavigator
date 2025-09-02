'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PasswordChangeModal from './PasswordChangeModal'

interface SidebarUserMenuProps {
  className?: string
}

export default function SidebarUserMenu({ className = '' }: SidebarUserMenuProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [userInfo, setUserInfo] = useState<{
    student_id: string
    name: string
    isAuthenticated: boolean
    role?: string
  } | null>(null)
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
              isAuthenticated: true,
              role: session.role
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

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('userSession')
    localStorage.removeItem('lastCredentials')
    setUserInfo({ student_id: '', name: '', isAuthenticated: false })
    router.push('/')
    // 刷新页面确保状态重置
    window.location.reload()
  }

  // 修改密码
  const handleChangePassword = async (newPassword: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'change_password',
          student_id: userInfo?.student_id,
          new_password: newPassword
        })
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('修改密码失败:', error)
      return false
    }
  }

  if (!userInfo?.isAuthenticated) {
    return null
  }

  return (
    <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 ${className}`}>
      {/* 用户信息头部 */}
      <div className="text-center mb-6 p-4 bg-white/10 rounded-lg">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
          {userInfo.name?.charAt(0) || userInfo.student_id?.charAt(0) || 'U'}
        </div>
        <div className="text-white font-medium text-lg mb-1">
          {userInfo.name || '学员'}
        </div>
        <div className="text-white/60 text-sm">
          {userInfo.student_id}
        </div>
      </div>

      {/* 菜单项 - 只保留修改密码和退出登录 */}
      <div className="space-y-2">
        {/* 修改密码 */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full px-4 py-3 text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200 flex items-center space-x-3 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
          </svg>
          <span>修改密码</span>
        </button>

        {/* 分隔线 */}
        <div className="border-t border-white/10 my-3"></div>

        {/* 退出登录 */}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 text-left text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors duration-200 flex items-center space-x-3 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>退出登录</span>
        </button>
      </div>
      
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