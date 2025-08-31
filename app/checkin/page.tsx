'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GlobalUserMenu from '../components/GlobalUserMenu'
import Card from '../components/Card'
import Button from '../components/Button'
import XiaohongshuProfileModal from '../components/XiaohongshuProfileModal'
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

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 小红书主页相关状态
  const [hasXiaohongshuProfile, setHasXiaohongshuProfile] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [xiaohongshuProfileUrl, setXiaohongshuProfileUrl] = useState('')

  // 打卡安排相关状态
  const [hasCheckinSchedule, setHasCheckinSchedule] = useState(false)
  const [checkinSchedule, setCheckinSchedule] = useState<any>(null)
  const [showNoScheduleModal, setShowNoScheduleModal] = useState(false)

  // 检查认证状态和小红书主页
  useEffect(() => {
    const userSession = localStorage.getItem('userSession')
    if (userSession) {
      try {
        const { student_id, name, isAuthenticated } = JSON.parse(userSession)
        if (isAuthenticated) {
          setIsAuthenticated(true)
          setStudentId(student_id)
          setUserName(name || '')
          // 检查小红书主页
          checkXiaohongshuProfile(student_id)
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

  // 检查用户是否有小红书主页记录
  const checkXiaohongshuProfile = async (studentId: string) => {
    try {
      const response = await fetch(`/api/user?student_id=${studentId}`)

      if (response.ok) {
        const result = await response.json()
        console.log('用户信息:', result) // 调试日志

        if (result?.xiaohongshu_profile_url && result.xiaohongshu_profile_url.trim() !== '') {
          setHasXiaohongshuProfile(true)
          setXiaohongshuProfileUrl(result.xiaohongshu_profile_url)
          // 检查打卡安排
          checkCheckinSchedule(studentId)
        } else {
          console.log('用户没有小红书主页，显示绑定模态框')
          setHasXiaohongshuProfile(false)
          setShowProfileModal(true) // 显示绑定小红书主页的模态框
        }
      } else {
        console.error('获取用户信息失败:', response.status)
        setHasXiaohongshuProfile(false)
        setShowProfileModal(true)
      }
    } catch (error) {
      console.error('检查小红书主页失败:', error)
      setHasXiaohongshuProfile(false)
      setShowProfileModal(true)
    }
  }

  // 检查学员的打卡安排
  const checkCheckinSchedule = async (studentId: string) => {
    try {
      const response = await fetch(`/api/admin/checkin-schedule?student_id=${studentId}`)
      const result = await response.json()

      if (result.success && result.data && result.data.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const activeSchedule = result.data.find((schedule: any) => {
          return schedule.start_date <= today && schedule.end_date >= today && schedule.is_active
        })

        if (activeSchedule) {
          // 在打卡周期内
          setHasCheckinSchedule(true)
          setCheckinSchedule(activeSchedule)
          console.log('学员在打卡周期内:', activeSchedule)
        } else {
          // 不在打卡周期内
          setHasCheckinSchedule(false)
          setShowNoScheduleModal(true)
        }
      } else {
        // 没有打卡安排
        setHasCheckinSchedule(false)
        setShowNoScheduleModal(true)
      }
    } catch (error) {
      console.error('检查打卡安排失败:', error)
      setHasCheckinSchedule(false)
      setShowNoScheduleModal(true)
    }
  }

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

  // 生成日历数据 - 按月显示真实日历
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // 从周日开始

    const days = []
    const current = new Date(startDate)
    const today = new Date().toISOString().split('T')[0]

    for (let i = 0; i < 42; i++) { // 6周 x 7天
      const dateStr = current.toISOString().split('T')[0]
      const isCurrentMonth = current.getMonth() === month
      const isToday = dateStr === today
      const checkinRecord = checkinRecords.find(record => record.checkin_date === dateStr)

      // 检查是否在打卡周期内
      const isInSchedule = checkinSchedule &&
        dateStr >= checkinSchedule.start_date &&
        dateStr <= checkinSchedule.end_date

      days.push({
        date: new Date(current),
        dateStr,
        day: current.getDate(),
        isCurrentMonth,
        isToday,
        hasCheckin: !!checkinRecord,
        checkinStatus: checkinRecord?.status || null,
        canCheckin: isToday && isInSchedule,
        isInSchedule // 是否在打卡周期内
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
      } else {
        setXiaohongshuUrl('')
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
          content_title: '',
          content_description: ''
        })
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('打卡提交成功！')
        setShowCheckinModal(false)
        fetchCheckinData() // 刷新数据
        
        // 清空表单
        setXiaohongshuUrl('')
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

  // 如果没有小红书主页，显示绑定提示（模态框会自动弹出）
  if (!hasXiaohongshuProfile && !showProfileModal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📱</div>
          <p className="text-white/80">正在检查小红书主页绑定状态...</p>
        </div>
      </div>
    )
  }

  // 如果没有打卡安排，显示提示
  if (hasXiaohongshuProfile && !hasCheckinSchedule && !showNoScheduleModal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📅</div>
          <p className="text-white/80">正在检查打卡安排...</p>
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

        {/* 打卡统计 - 简化版本，只显示总打卡天数 */}
        <div className="flex justify-center mb-6">
          <Card className="text-center px-8 py-6">
            <div className="text-4xl font-bold text-blue-400 mb-2">{checkinStats.total_days}</div>
            <div className="text-white/70 text-lg">总打卡天数</div>
          </Card>
        </div>

        {/* 今日打卡按钮 */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={() => {
              const today = new Date()
              const todayStr = today.toISOString().split('T')[0]
              setSelectedDate(todayStr)

              // 检查今天是否已经打卡
              const todayRecord = checkinRecords.find(record =>
                record.checkin_date === todayStr
              )

              if (todayRecord) {
                // 已有记录，预填数据
                setXiaohongshuUrl(todayRecord.xiaohongshu_url || '')
              } else {
                // 清空表单
                setXiaohongshuUrl('')
              }

              setShowCheckinModal(true)
            }}
            className="px-8 py-3 text-lg font-medium"
          >
            📝 今日打卡
          </Button>
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
          <div className="grid grid-cols-7 gap-3 mb-4">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-white/70 font-medium py-3 text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* 日历格子 - 调整为合适大小 */}
          <div className="grid grid-cols-7 gap-3">
            {calendarDays.map((day, index) => {
              // 基于打卡安排的状态逻辑
              const today = new Date().toISOString().split('T')[0]
              const isPast = day.dateStr < today

              let statusClass = 'glass-effect border-white/20'
              let textClass = day.isCurrentMonth ? 'text-white' : 'text-white/30'

              if (!day.isCurrentMonth) {
                // 不是当前月的日期 - 灰色
                statusClass = 'bg-gray-500/10 border-gray-500/30'
                textClass = 'text-white/30'
              } else if (!day.isInSchedule) {
                // 不在打卡周期内 - 普通显示
                statusClass = 'bg-gray-500/10 border-gray-500/30'
                textClass = 'text-white/50'
              } else if (day.hasCheckin) {
                // 已打卡 - 绿色
                statusClass = 'bg-green-500/30 border-green-400'
                textClass = 'text-white'
              } else if (isPast) {
                // 忘记打卡（过去的日期但没有打卡）- 红色
                statusClass = 'bg-red-500/30 border-red-400'
                textClass = 'text-white'
              } else {
                // 待打卡（未来的日期或今天）- 灰色边框
                statusClass = 'bg-gray-500/20 border-gray-400/50'
                textClass = 'text-white'
              }

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`
                    aspect-square w-12 h-12 flex items-center justify-center text-sm font-medium rounded-lg border transition-all duration-300 relative
                    ${textClass}
                    ${day.isToday ? 'ring-2 ring-blue-400' : ''}
                    ${day.canCheckin ? 'cursor-pointer hover:bg-blue-500/20' : ''}
                    ${statusClass}
                  `}
                >
                  <span>{day.day}</span>
                  {day.isToday && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
                  )}
                </div>
              )
            })}
          </div>

          {/* 图例 - 简化为三种状态 */}
          <div className="mt-6 flex justify-center gap-6 text-xs text-white/70">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500/30 border border-green-400 rounded mr-2"></div>
              已打卡
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500/20 border border-gray-400/50 rounded mr-2"></div>
              未打卡
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500/30 border border-red-400 rounded mr-2"></div>
              忘记打卡
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

        {/* 小红书主页绑定模态框 */}
        <XiaohongshuProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpdate={async (profileUrl: string) => {
            try {
              // 更新用户的小红书主页链接
              const response = await fetch('/api/user', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  student_id: studentId,
                  xiaohongshu_profile_url: profileUrl
                })
              })

              const result = await response.json()
              if (result.success) {
                setXiaohongshuProfileUrl(profileUrl)
                setHasXiaohongshuProfile(true)
                setShowProfileModal(false)
                return true
              } else {
                console.error('更新小红书主页失败:', result.error)
                return false
              }
            } catch (error) {
              console.error('更新小红书主页失败:', error)
              return false
            }
          }}
          currentUrl={xiaohongshuProfileUrl}
        />

        {/* 没有打卡安排的提示模态框 */}
        {showNoScheduleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-8 rounded-xl border border-white/20 max-w-md w-full text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-white mb-4">打卡还未开始</h3>
              <p className="text-white/80 mb-6">
                您的打卡还未开始，请联系管理员设置打卡时间。
              </p>
              <button
                onClick={() => {
                  setShowNoScheduleModal(false)
                  router.push('/')
                }}
                className="px-6 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 rounded-lg transition-all duration-300"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
