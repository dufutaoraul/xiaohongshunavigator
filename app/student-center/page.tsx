'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/app/components/Card'
import Button from '@/app/components/Button'
import GlobalUserMenu from '../components/GlobalUserMenu'

interface StudentInfo {
  student_id: string
  nickname: string
  real_name?: string
  created_at?: string
}

interface CheckinRecord {
  id: number
  checkin_date: string
  xiaohongshu_link: string
  created_at: string
}

export default function StudentCenterPage() {
  const router = useRouter()
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // 检查登录状态
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedStudentId = localStorage.getItem('studentId')
        const storedNickname = localStorage.getItem('nickname')
        
        if (storedStudentId && storedNickname) {
          setIsLoggedIn(true)
          setStudentInfo({
            student_id: storedStudentId,
            nickname: storedNickname
          })
          loadCheckinRecords(storedStudentId)
        } else {
          setIsLoggedIn(false)
        }
      } catch (error) {
        console.error('检查认证状态失败:', error)
        setIsLoggedIn(false)
      }
    }

    checkAuth()
  }, [])

  // 加载打卡记录
  const loadCheckinRecords = async (studentId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/checkin/records?student_id=${studentId}`)
      
      if (response.ok) {
        const data = await response.json()
        setCheckinRecords(data.records || [])
      } else {
        console.error('加载打卡记录失败')
      }
    } catch (error) {
      console.error('加载打卡记录错误:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('studentId')
    localStorage.removeItem('nickname')
    setIsLoggedIn(false)
    setStudentInfo(null)
    setCheckinRecords([])
    router.push('/')
  }

  // 如果未登录，显示登录提示
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <GlobalUserMenu />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-white mb-4">学员中心</h1>
            <p className="text-gray-300 mb-6">请先登录以查看您的学习进度</p>
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
            >
              前往登录
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <GlobalUserMenu />
      
      <div className="container mx-auto px-4 py-8">
        {/* 学员信息卡片 */}
        <Card className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-white">学员中心</h1>
            <Button 
              onClick={handleLogout}
              variant="outline"
              size="sm"
            >
              退出登录
            </Button>
          </div>
          
          {studentInfo && (
            <div className="bg-white/10 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-white mb-2">个人信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                <div>
                  <span className="font-medium">学号:</span> {studentInfo.student_id}
                </div>
                <div>
                  <span className="font-medium">昵称:</span> {studentInfo.nickname}
                </div>
                {studentInfo.real_name && (
                  <div>
                    <span className="font-medium">真实姓名:</span> {studentInfo.real_name}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* 功能导航 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => router.push('/checkin')}>
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-white mb-2">每日打卡</h3>
            <p className="text-gray-300 text-sm">上传小红书链接完成打卡</p>
          </Card>

          <Card className="text-center cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => router.push('/homework')}>
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-white mb-2">作业系统</h3>
            <p className="text-gray-300 text-sm">查看和提交作业</p>
          </Card>

          <Card className="text-center cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => router.push('/profile')}>
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-lg font-semibold text-white mb-2">个人资料</h3>
            <p className="text-gray-300 text-sm">完善个人信息</p>
          </Card>
        </div>

        {/* 最近打卡记录 */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">最近打卡记录</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="text-gray-300 mt-2">加载中...</p>
            </div>
          ) : checkinRecords.length > 0 ? (
            <div className="space-y-3">
              {checkinRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="bg-white/10 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">
                        {new Date(record.checkin_date).toLocaleDateString('zh-CN')}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {new Date(record.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <a 
                      href={record.xiaohongshu_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      查看链接 →
                    </a>
                  </div>
                </div>
              ))}
              
              {checkinRecords.length > 5 && (
                <div className="text-center pt-4">
                  <Button 
                    onClick={() => router.push('/checkin')}
                    variant="outline"
                    size="sm"
                  >
                    查看全部记录
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-300 mb-4">还没有打卡记录</p>
              <Button onClick={() => router.push('/checkin')}>
                开始打卡
              </Button>
            </div>
          )}
        </Card>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
