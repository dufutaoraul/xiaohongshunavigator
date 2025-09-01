'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PasswordChangeModal from './PasswordChangeModal'

interface UserMenuProps {
  className?: string
}

export default function UserMenu({ className = '' }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [userInfo, setUserInfo] = useState<{
    student_id: string
    name: string
  } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 获取用户信息
  useEffect(() => {
    const userSession = localStorage.getItem('userSession')
    if (userSession) {
      try {
        const session = JSON.parse(userSession)
        if (session.isAuthenticated) {
          setUserInfo({
            student_id: session.student_id,
            name: session.name
          })
        }
      } catch {
        // 忽略解析错误
      }
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
    setUserInfo(null)
    setIsOpen(false)
    router.push('/')
    // 刷新页面确保状态重置
    window.location.reload()
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

  // 如果没有用户信息，不显示菜单
  if (!userInfo) {
    return null
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* 用户头像/按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all duration-300"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {userInfo.name?.charAt(0) || userInfo.student_id?.charAt(0) || 'U'}
        </div>
        <div className="text-left hidden sm:block">
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
        <div className="absolute right-0 mt-2 w-64 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50">
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
