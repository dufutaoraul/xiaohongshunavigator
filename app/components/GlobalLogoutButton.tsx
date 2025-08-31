'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function GlobalLogoutButton() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // 检查是否已登录
    const userSession = localStorage.getItem('userSession')
    if (userSession) {
      try {
        const { isAuthenticated } = JSON.parse(userSession)
        setIsAuthenticated(isAuthenticated)
      } catch {
        setIsAuthenticated(false)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('userSession')
    router.push('/')
  }

  // 只在已登录时显示
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 rounded-lg text-sm transition-all duration-300 flex items-center gap-2 backdrop-blur-sm border border-red-500/30"
      >
        🚪 退出登录
      </button>
    </div>
  )
}
