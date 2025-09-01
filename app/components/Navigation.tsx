'use client'

import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'

export default function Navigation() {
  const { isAdmin } = useAuth()

  return (
    <nav className="cosmic-nav fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold gradient-text hover:scale-105 transition-transform duration-300">
              ✨ 小红书AI灵感领航员
            </Link>
          </div>
          <div className="flex space-x-1">
            <Link href="/profile" className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm">
              🧑‍💼 个人IP资料库
            </Link>
            <Link href="/generate" className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm">
              🤖 AI灵感引擎
            </Link>

            <Link href="/dashboard" className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm">
              📊 打卡中心
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm">
                ⚙️ 后台管理
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}