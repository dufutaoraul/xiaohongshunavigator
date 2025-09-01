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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

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
        // 获取本地日期，避免时区问题
        const today = new Date()
        const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
        const todayStr = localToday.toISOString().split('T')[0]

        console.log('今天日期:', todayStr)
        console.log('打卡安排:', result.data)

        const activeSchedule = result.data.find((schedule: any) => {
          console.log(`检查安排: ${schedule.start_date} <= ${todayStr} <= ${schedule.end_date}`)
          return schedule.start_date <= todayStr && schedule.end_date >= todayStr && schedule.is_active
        })

        if (activeSchedule) {
          // 在打卡周期内
          setHasCheckinSchedule(true)
          setCheckinSchedule(activeSchedule)
          console.log('学员在打卡周期内:', activeSchedule)

          // 显示欢迎弹窗
          setShowWelcomeModal(true)
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
      // 获取打卡记录，添加时间戳避免缓存
      const timestamp = new Date().getTime()
      const recordsResponse = await fetch(`/api/checkin/submit?student_id=${studentId}&days=90&_t=${timestamp}`)
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json()
        console.log('打卡记录API响应:', recordsData)
        
        if (recordsData.success && recordsData.data) {
          // 转换数据格式以匹配前端期望的结构
          const records = recordsData.data.checkins?.map((record: any) => ({
            id: record.id,
            student_id: record.student_id,
            checkin_date: record.date,
            xiaohongshu_url: record.links?.[0] || '', // 取第一个链接
            links: record.links || [],
            passed: record.passed,
            created_at: record.created_at,
            updated_at: record.updated_at
          })) || []
          
          setCheckinRecords(records)
          console.log('转换后的打卡记录:', records)
          
          // 更新统计数据
          setCheckinStats({
            total_days: recordsData.data.total_checkin_days || 0,
            consecutive_days: 0, // 需要计算连续天数
            current_month_days: recordsData.data.passed_days || 0,
            completion_rate: parseFloat(recordsData.data.pass_rate) || 0
          })
        }
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

    // 获取本地今天日期，避免时区问题
    const todayDate = new Date()
    const localToday = new Date(todayDate.getTime() - (todayDate.getTimezoneOffset() * 60000))
    const today = localToday.toISOString().split('T')[0]

    for (let i = 0; i < 42; i++) { // 6周 x 7天
      // 获取本地日期字符串，避免时区问题
      const localCurrent = new Date(current.getTime() - (current.getTimezoneOffset() * 60000))
      const dateStr = localCurrent.toISOString().split('T')[0]
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
        checkinRecord: checkinRecord, // 添加完整的打卡记录
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
      const response = await fetch('/api/checkin/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: studentId,
          urls: [xiaohongshuUrl],
          date: selectedDate
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage('打卡提交成功！')
        
        // 立即刷新打卡数据
        await fetchCheckinData()
        
        // 延迟关闭模态框，让用户看到成功消息
        setTimeout(() => {
          setShowCheckinModal(false)
          setXiaohongshuUrl('')
          setMessage('')
        }, 1500)
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
              // 获取本地今天日期，避免时区问题
              const today = new Date()
              const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
              const todayStr = localToday.toISOString().split('T')[0]
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
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-white/70 font-medium py-2 text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* 日历格子 - 标准日历样式 */}
          <div className="grid grid-cols-7 gap-1">
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
                // 已打卡 - 绿色（打卡合格）
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
                    aspect-square w-full h-14 flex items-center justify-center text-base font-medium rounded-lg border transition-all duration-300 relative
                    ${textClass}
                    ${day.isToday ? 'ring-2 ring-blue-400' : ''}
                    ${day.canCheckin ? 'cursor-pointer hover:bg-blue-500/20' : ''}
                    ${statusClass}
                  `}
                >
                  <span>{day.day}</span>

                  {/* 打卡状态图标 */}
                  {day.hasCheckin && (
                    <div className="absolute top-1 right-1 text-xs">
                      ✅
                    </div>
                  )}

                  {/* 今天标记 */}
                  {day.isToday && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
                  )}
                </div>
              )
            })}
          </div>

          {/* 图例 - 只显示三种状态 */}
          <div className="mt-6 flex justify-center flex-wrap gap-6 text-xs text-white/70">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500/30 border border-green-400 rounded mr-2"></div>
              打卡合格
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

        {/* 最近打卡记录 */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">📋 最近打卡记录</h2>

          {checkinRecords.length > 0 ? (
            <div className="space-y-4">
              {checkinRecords
                .sort((a, b) => new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime())
                .slice(0, 10)
                .map((record) => (
                <div key={record.id || record.checkin_date} className="glass-effect p-4 rounded-lg border border-white/20">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white font-medium">
                          {new Date(record.checkin_date).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300">
                          ✅ 已打卡
                        </span>
                      </div>

                      {record.xiaohongshu_url && (
                        <div className="mb-2">
                          <a
                            href={record.xiaohongshu_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm break-all"
                          >
                            🔗 {record.xiaohongshu_url}
                          </a>
                        </div>
                      )}

                      {record.admin_comment && (
                        <div className="mt-2 p-2 bg-white/5 rounded text-sm text-white/70">
                          <span className="text-white/50">管理员备注：</span>
                          {record.admin_comment}
                        </div>
                      )}

                      <div className="text-xs text-white/50 mt-2">
                        提交时间：{new Date(record.created_at || record.checkin_date).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-white/60 mb-4">还没有打卡记录</p>
              <p className="text-white/40 text-sm">点击上方&ldquo;今日打卡&rdquo;按钮开始您的打卡之旅</p>
            </div>
          )}
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
                    {loading ? '提交中...' : (selectedDate && checkinRecords.find(record => record.checkin_date === selectedDate) ? '修改链接' : '提交打卡')}
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

        {/* 打卡开始欢迎弹窗 */}
        {showWelcomeModal && checkinSchedule && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-8 rounded-xl border border-white/20 max-w-md w-full text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-white mb-4">打卡之旅开始啦！</h3>
              <p className="text-white/80 mb-6">
                您的打卡周期从 <span className="text-blue-300 font-medium">{checkinSchedule.start_date}</span> 开始，
                到 <span className="text-blue-300 font-medium">{checkinSchedule.end_date}</span> 结束。
                <br /><br />
                坚持就是胜利，让我们一起努力，记录每一天的成长！💪
              </p>
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="px-6 py-2 bg-green-500/20 text-green-300 hover:bg-green-500/30 hover:text-green-200 rounded-lg transition-all duration-300"
              >
                开始打卡
              </button>
            </div>
          </div>
        )}

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
