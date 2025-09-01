'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface UserProfileStatusProps {
  isHomePage?: boolean
}

export default function UserProfileStatus({ isHomePage }: UserProfileStatusProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)

  // 自动检测是否为首页
  const isCurrentlyHomePage = isHomePage !== undefined ? isHomePage : pathname === '/'

  useEffect(() => {
    // 检查是否已登录
    const userSession = localStorage.getItem('userSession')
    if (userSession) {
      try {
        const sessionData = JSON.parse(userSession)
        setIsAuthenticated(sessionData.isAuthenticated)
        setUserInfo(sessionData.user)
      } catch {
        setIsAuthenticated(false)
        setUserInfo(null)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('userSession')
    router.push('/')
  }

  // 只在已登录时显示
  if (!isAuthenticated || !userInfo) {
    return null
  }

  const containerClass = isCurrentlyHomePage
    ? "flex justify-center mb-8" // 首页居中显示
    : "fixed top-4 right-4 z-50" // 其他页面右上角显示

  return (
    <div className={containerClass}>
      <div className="glass-effect p-4 rounded-lg border border-white/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="text-white font-medium">
              {userInfo.name || userInfo.student_id}
            </div>
            <div className="text-white/70 text-sm">
              学号: {userInfo.student_id}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 rounded text-sm transition-all duration-300"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}
