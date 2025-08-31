'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GlobalUserMenu from '../components/GlobalUserMenu'
import Card from '../components/Card'
import Button from '../components/Button'
import { CheckinRecord, CheckinStats } from '@/lib/checkin-database'

export default function CheckinPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [userName, setUserName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([])
  const [checkinStats, setCheckinStats] = useState<CheckinStats>({ 
    total_days: 0, 
    consecutive_days: 0, 
    current_month_days: 0, 
    completion_rate: 0 
  })
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [xiaohongshuUrl, setXiaohongshuUrl] = useState('')
  const [contentTitle, setContentTitle] = useState('')
  const [contentDescription, setContentDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 检查认证状态
  useEffect(() => {
    const userSession = localStorage.getItem('userSession')
    if (userSession) {
      try {
        const { student_id, name, isAuthenticated } = JSON.parse(userSession)
        if (isAuthenticated) {
          setIsAuthenticated(true)
          setStudentId(student_id)
          setUserName(name || '')
        } else {
          router.push('/profile')
        }
      } catch {
        router.push('/profile')
      }
    } else {
      router.push('/profile')
    }
    setIsLoading(false)
  }, [router])

  // 获取打卡数据
  useEffect(() => {
    if (isAuthenticated && studentId) {
      fetchCheckinData()
    }
  }, [isAuthenticated, studentId, currentDate])

  const fetchCheckinData = async () => {
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1

      // 获取当月打卡记录
      const recordsResponse = await fetch(`/api/checkin?student_id=${studentId}&type=monthly&year=${year}&month=${month}`)
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json()
        setCheckinRecords(recordsData.data || [])
      }

      // 获取打卡统计
      const statsResponse = await fetch(`/api/checkin?student_id=${studentId}&type=stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setCheckinStats(statsData.data || { total_days: 0, consecutive_days: 0, current_month_days: 0, completion_rate: 0 })
      }
    } catch (error) {
      console.error('Error fetching checkin data:', error)
    }
  }

  // 生成日历数据
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // 从周日开始

    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) { // 6周 x 7天
      const dateStr = current.toISOString().split('T')[0]
      const isCurrentMonth = current.getMonth() === month
      const isToday = dateStr === new Date().toISOString().split('T')[0]
      const checkinRecord = checkinRecords.find(record => record.checkin_date === dateStr)

      days.push({
        date: new Date(current),
        dateStr,
        day: current.getDate(),
        isCurrentMonth,
        isToday,
        hasCheckin: !!checkinRecord,
        checkinStatus: checkinRecord?.status || null,
        canCheckin: isToday && isCurrentMonth
      })

      current.setDate(current.getDate() + 1)
    }

    return days
  }

  // 处理日期点击
  const handleDateClick = (day: any) => {
    if (day.canCheckin) {
      setSelectedDate(day.dateStr)
      setShowCheckinModal(true)
      
      // 如果今天已经有打卡记录，预填数据
      const existingRecord = checkinRecords.find(record => record.checkin_date === day.dateStr)
      if (existingRecord) {
        setXiaohongshuUrl(existingRecord.xiaohongshu_url)
        setContentTitle(existingRecord.content_title || '')
        setContentDescription(existingRecord.content_description || '')
      } else {
        setXiaohongshuUrl('')
        setContentTitle('')
        setContentDescription('')
      }
    }
  }

  // 提交打卡
  const handleSubmitCheckin = async () => {
    if (!xiaohongshuUrl.trim()) {
      setMessage('请输入小红书链接')
      return
    }

    if (!xiaohongshuUrl.includes('xiaohongshu.com') && !xiaohongshuUrl.includes('xhslink.com')) {
      setMessage('请输入有效的小红书链接')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: studentId,
          student_name: userName,
          checkin_date: selectedDate,
          xiaohongshu_url: xiaohongshuUrl,
          content_title: contentTitle,
          content_description: contentDescription
        })
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('打卡提交成功！')
        setShowCheckinModal(false)
        fetchCheckinData() // 刷新数据
        
        // 清空表单
        setXiaohongshuUrl('')
        setContentTitle('')
        setContentDescription('')
      } else {
        setMessage(result.error || '提交失败，请重试')
      }
    } catch (error) {
      console.error('Submit checkin error:', error)
      setMessage('网络错误，请检查连接')
    } finally {
      setLoading(false)
    }
  }

  // 切换月份
  const changeMonth = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-white/80">正在验证身份...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <p className="text-white/80">需要登录后才能访问打卡中心</p>
        </div>
      </div>
    )
  }

  const calendarDays = generateCalendarDays()
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="min-h-screen relative">
      {/* 全局用户菜单 - 左上角 */}
      <GlobalUserMenu className="absolute top-6 left-6 z-50" />

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center fade-in-up">
          <h1 className="text-4xl font-bold gradient-text mb-6">📅 打卡中心</h1>
          <p className="text-xl text-white/80">
            90天打卡挑战，坚持就是胜利！
          </p>
          
          {/* 用户信息显示 */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg max-w-md mx-auto">
            <h3 className="text-white font-medium mb-2 flex items-center justify-center">
              <span className="mr-2">👤</span>
              欢迎 {userName}
            </h3>
            <p className="text-white/70 text-sm">
              学号：{studentId}
            </p>
          </div>
        </div>

        {/* 打卡统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-400">{checkinStats.total_days}</div>
            <div className="text-white/70 text-sm mt-1">总打卡天数</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-400">{checkinStats.consecutive_days}</div>
            <div className="text-white/70 text-sm mt-1">连续打卡</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-purple-400">{checkinStats.current_month_days}</div>
            <div className="text-white/70 text-sm mt-1">本月打卡</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-pink-400">{checkinStats.completion_rate}%</div>
            <div className="text-white/70 text-sm mt-1">完成率</div>
          </Card>
        </div>

        {/* 日历界面 */}
        <Card title="📅 打卡日历" icon="📊" className="mb-8">
          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => changeMonth(-1)}
              className="px-4 py-2"
            >
              ← 上月
            </Button>
            <h2 className="text-xl font-bold text-white">
              {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
            </h2>
            <Button
              variant="outline"
              onClick={() => changeMonth(1)}
              className="px-4 py-2"
            >
              下月 →
            </Button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-white/70 font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* 日历格子 */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square flex items-center justify-center text-sm font-medium rounded-lg border transition-all duration-300 relative
                  ${day.isCurrentMonth ? 'text-white' : 'text-white/30'}
                  ${day.isToday ? 'ring-2 ring-blue-400' : ''}
                  ${day.canCheckin ? 'cursor-pointer hover:bg-blue-500/20 border-blue-400/50' : 'border-white/20'}
                  ${day.hasCheckin ? (
                    day.checkinStatus === 'approved' ? 'bg-green-500/20 border-green-400' :
                    day.checkinStatus === 'rejected' ? 'bg-red-500/20 border-red-400' :
                    'bg-yellow-500/20 border-yellow-400'
                  ) : 'glass-effect'}
                `}
              >
                <span>{day.day}</span>
                {day.hasCheckin && (
                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    day.checkinStatus === 'approved' ? 'bg-green-400' :
                    day.checkinStatus === 'rejected' ? 'bg-red-400' :
                    'bg-yellow-400'
                  }`} />
                )}
                {day.isToday && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
                )}
              </div>
            ))}
          </div>

          {/* 图例 */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/70">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500/20 border border-green-400 rounded mr-2"></div>
              已通过
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-400 rounded mr-2"></div>
              待审核
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500/20 border border-red-400 rounded mr-2"></div>
              未通过
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 ring-2 ring-blue-400 rounded mr-2"></div>
              今天
            </div>
          </div>
        </Card>

        {/* 打卡模态框 */}
        {showCheckinModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-6 rounded-lg border border-white/20 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">📝 今日打卡</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    小红书链接 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={xiaohongshuUrl}
                    onChange={(e) => setXiaohongshuUrl(e.target.value)}
                    placeholder="请输入小红书作品链接"
                    className="w-full px-3 py-2 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    内容标题 (可选)
                  </label>
                  <input
                    type="text"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    placeholder="简单描述你的作品标题"
                    className="w-full px-3 py-2 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    内容描述 (可选)
                  </label>
                  <textarea
                    value={contentDescription}
                    onChange={(e) => setContentDescription(e.target.value)}
                    placeholder="分享你的创作心得或学习收获"
                    rows={3}
                    className="w-full px-3 py-2 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none resize-none"
                  />
                </div>

                {message && (
                  <div className={`p-3 rounded-lg text-sm ${
                    message.includes('成功') ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-red-500/20 text-red-300 border border-red-400/30'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleSubmitCheckin}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? '提交中...' : '提交打卡'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCheckinModal(false)
                      setMessage('')
                    }}
                    className="flex-1"
                  >
                    取消
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
