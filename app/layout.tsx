import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '小红书AI灵感领航员',
  description: '为爱学AI创富营学员提供个人IP设定、AI内容生成和自动化打卡的一体化工具',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} cosmic-bg`}>
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
                  🧑‍💼 个人资料
                </Link>
                <Link href="/generate" className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm">
                  🤖 AI生成
                </Link>
                <Link href="/dashboard" className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm">
                  📊 打卡中心
                </Link>
                <Link href="/showcase" className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm">
                  🏆 优秀案例
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen pt-16">
          {children}
        </main>
      </body>
    </html>
  )
}