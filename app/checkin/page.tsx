'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GlobalUserMenu from '../components/GlobalUserMenu'
import Card from '../components/Card'
import Button from '../components/Button'
import XiaohongshuProfileModal from '../components/XiaohongshuProfileModal'
import { CheckinRecord, CheckinStats } from '@/lib/checkin-database'
import { getBeijingDateString, isToday, isPastDate } from '@/lib/date-utils'

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
  const [showCheckinEndedModal, setShowCheckinEndedModal] = useState(false)
  const [hasShownWelcomeToday, setHasShownWelcomeToday] = useState(false)

  // 自主设定权限相关状态
  const [canSelfSchedule, setCanSelfSchedule] = useState(false)
  const [selfScheduleStatus, setSelfScheduleStatus] = useState<any>(null)
  const [showSelfScheduleModal, setShowSelfScheduleModal] = useState(false)
  const [showSelfScheduleSetupModal, setShowSelfScheduleSetupModal] = useState(false)

  // 检查今天是否已经显示过欢迎弹窗
  useEffect(() => {
    const today = getBeijingDateString()
    const welcomeShownKey = `welcome_shown_${today}`
    const hasShown = localStorage.getItem(welcomeShownKey) === 'true'
    setHasShownWelcomeToday(hasShown)
    console.log('🔍 [欢迎弹窗] 检查今天是否已显示:', { today, hasShown })
  }, [])

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
          console.log('用户没有小红书主页，跳转到绑定页面')
          setHasXiaohongshuProfile(false)
          // 跳转到profile页面进行小红书主页绑定
          window.location.href = '/profile'
        }
      } else {
        console.error('获取用户信息失败:', response.status)
        setHasXiaohongshuProfile(false)
        // 跳转到profile页面进行小红书主页绑定
        window.location.href = '/profile'
      }
    } catch (error) {
      console.error('检查小红书主页失败:', error)
      setHasXiaohongshuProfile(false)
      // 跳转到profile页面进行小红书主页绑定
      window.location.href = '/profile'
    }
  }

  // 检查学员的自主设定权限
  const checkSelfSchedulePermission = async (studentId: string) => {
    try {
      console.log('🔍 [自主设定权限] 开始检查学员:', studentId)
      const response = await fetch(`/api/student/self-schedule`, {
        headers: {
          'Authorization': `Bearer ${studentId}`
        }
      })

      console.log('🔍 [自主设定权限] API响应状态:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 [自主设定权限] API响应数据:', data)
        setSelfScheduleStatus(data)
        setCanSelfSchedule(data.can_self_schedule)
        return data
      } else {
        console.error('🔍 [自主设定权限] API响应失败:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('🔍 [自主设定权限] 错误详情:', errorText)
      }
    } catch (error) {
      console.error('🔍 [自主设定权限] 检查失败:', error)
    }
    return null
  }

  // 检查学员的打卡安排
  const checkCheckinSchedule = async (studentId: string) => {
    try {
      // 首先检查自主设定权限
      const selfScheduleData = await checkSelfSchedulePermission(studentId)
      console.log('🔍 [打卡安排检查] 自主设定权限数据:', selfScheduleData)

      const response = await fetch(`/api/admin/checkin-schedule?student_id=${studentId}`)
      const result = await response.json()
      console.log('🔍 [打卡安排检查] API响应:', result)
      console.log('🔍 [打卡安排检查] API响应状态:', response.status, response.statusText)

      if (result.success && result.data && result.data.length > 0) {
        // 获取本地日期，避免时区问题
        const todayStr = getBeijingDateString()

        console.log('今天日期:', todayStr)
        console.log('打卡安排:', result.data)

        // 找到学员的打卡安排（不管是否在日期范围内）
        console.log('🔍 [打卡安排检查] 所有安排:', result.data.map((s: any) => ({
          id: s.id,
          student_id: s.student_id,
          is_active: s.is_active,
          start_date: s.start_date,
          end_date: s.end_date
        })))

        const userSchedule = result.data.find((schedule: any) => schedule.is_active)
        console.log('🔍 [打卡安排检查] 找到的活跃安排:', userSchedule)

        if (userSchedule) {
          const isInDateRange = userSchedule.start_date <= todayStr && userSchedule.end_date >= todayStr
          const isBeforeStart = todayStr < userSchedule.start_date
          const isAfterEnd = todayStr > userSchedule.end_date

          console.log(`检查安排: ${userSchedule.start_date} <= ${todayStr} <= ${userSchedule.end_date}`)
          console.log(`在日期范围内: ${isInDateRange}, 开始前: ${isBeforeStart}, 结束后: ${isAfterEnd}`)

          if (isAfterEnd) {
            // 打卡已结束
            setHasCheckinSchedule(true)
            setCheckinSchedule(userSchedule)
            setShowCheckinEndedModal(true)
            console.log('学员打卡已结束:', userSchedule)
          } else if (isInDateRange) {
            // 在打卡周期内
            setHasCheckinSchedule(true)
            setCheckinSchedule(userSchedule)
            console.log('学员在打卡周期内:', userSchedule)

            // 只有今天还没有显示过欢迎弹窗时才显示
            if (!hasShownWelcomeToday) {
              console.log('🎉 [欢迎弹窗] 今天首次显示欢迎弹窗')
              setShowWelcomeModal(true)

              // 记录今天已经显示过欢迎弹窗
              const today = getBeijingDateString()
              const welcomeShownKey = `welcome_shown_${today}`
              localStorage.setItem(welcomeShownKey, 'true')
              setHasShownWelcomeToday(true)
            } else {
              console.log('🔍 [欢迎弹窗] 今天已经显示过，跳过')
            }
          } else if (isBeforeStart) {
            // 打卡还未开始，但有安排
            setHasCheckinSchedule(true)
            setCheckinSchedule(userSchedule)
            setShowNoScheduleModal(true)
            console.log('学员打卡还未开始，但有安排:', userSchedule)
          } else {
            // 其他情况，显示无安排提示
            setHasCheckinSchedule(false)
            setShowNoScheduleModal(true)
          }
        } else {
          // 没有找到活跃的打卡安排，检查是否有自主设定权限
          console.log('🔍 [打卡安排检查] 没有找到活跃的打卡安排')
          setHasCheckinSchedule(false)

          // 如果有自主设定权限且还没使用过，显示自主设定模态框
          if (selfScheduleData?.can_self_schedule && !selfScheduleData?.has_used_opportunity) {
            console.log('🔍 [打卡安排检查] 显示自主设定模态框')
            setShowSelfScheduleModal(true)
          } else if (selfScheduleData?.can_self_schedule && selfScheduleData?.has_used_opportunity) {
            // 已经使用过自主设定权限，但没有找到安排，可能是数据问题
            console.log('🔍 [打卡安排检查] 已使用自主设定权限但没找到安排，显示无安排提示')
            setShowNoScheduleModal(true)
          } else {
            // 没有自主设定权限，显示无安排提示
            console.log('🔍 [打卡安排检查] 没有自主设定权限，显示无安排提示')
            setShowNoScheduleModal(true)
          }
        }
      } else {
        // API返回没有打卡安排，检查是否有自主设定权限
        console.log('🔍 [打卡安排检查] API返回没有打卡安排')
        setHasCheckinSchedule(false)

        if (selfScheduleData?.can_self_schedule && !selfScheduleData?.has_used_opportunity) {
          console.log('🔍 [打卡安排检查] 显示自主设定模态框')
          setShowSelfScheduleModal(true)
        } else if (selfScheduleData?.can_self_schedule && selfScheduleData?.has_used_opportunity) {
          // 已经使用过自主设定权限，但API没有返回安排，可能是数据问题
          console.log('🔍 [打卡安排检查] 已使用自主设定权限但API没返回安排，显示无安排提示')
          setShowNoScheduleModal(true)
        } else {
          console.log('🔍 [打卡安排检查] 没有自主设定权限，显示无安排提示')
          setShowNoScheduleModal(true)
        }
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

  // 当打卡记录或打卡安排变化时，重新计算统计数据
  useEffect(() => {
    if (checkinRecords.length >= 0 && checkinSchedule) {
      const stats = calculateCheckinStats(checkinRecords, checkinSchedule)
      setCheckinStats(stats)
      console.log('重新计算统计数据:', stats)
    }
  }, [checkinRecords, checkinSchedule])

  const fetchCheckinData = async () => {
    try {
      console.log('🔍 [数据加载] 开始获取打卡数据')
      setLoading(true)

      // 先获取打卡安排
      await checkCheckinSchedule(studentId)

      // 获取打卡记录，使用正确的API
      const timestamp = new Date().getTime()
      const apiUrl = `/api/checkin/records?student_id=${studentId}&limit=90&_t=${timestamp}`
      console.log('🔍 [前端] 请求打卡记录API:', apiUrl)

      const recordsResponse = await fetch(apiUrl)
      console.log('🔍 [前端] API响应状态:', recordsResponse.status, recordsResponse.statusText)

      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json()
        console.log('🔍 [前端] 打卡记录API响应:', JSON.stringify(recordsData, null, 2))

        if (recordsData.success && recordsData.records) {
          // 转换数据格式以匹配前端期望的结构
          const records = recordsData.records.map((record: any) => ({
            id: record.id,
            student_id: record.student_id,
            student_name: record.student_name || '',
            checkin_date: record.checkin_date,
            xiaohongshu_url: record.xiaohongshu_link || record.xiaohongshu_url || '', // 兼容两种字段名
            status: record.status || 'pending',
            created_at: record.created_at,
            updated_at: record.updated_at
          })) || []

          setCheckinRecords(records)
          console.log('✅ [前端] 转换后的打卡记录:', records)
          console.log('✅ [前端] 设置打卡记录数量:', records.length)
        } else {
          console.log('❌ [前端] API响应格式不正确或无数据:', recordsData)
          setCheckinRecords([])
        }
      } else {
        console.error('❌ [前端] 获取打卡记录失败:', recordsResponse.status, recordsResponse.statusText)
        const errorText = await recordsResponse.text()
        console.error('❌ [前端] 错误响应内容:', errorText)
        setCheckinRecords([])
      }
    } catch (error) {
      console.error('Error fetching checkin data:', error)
    } finally {
      console.log('🔍 [数据加载] 数据加载完成')
      setLoading(false)
    }
  }

  // 计算统计数据的函数
  const calculateCheckinStats = (records: any[], schedule: any) => {
    // 如果没有打卡安排，总天数为0
    if (!schedule) {
      return {
        total_days: 0,
        consecutive_days: 0,
        current_month_days: 0,
        completion_rate: 0
      }
    }

    // 只计算在打卡周期内的记录
    const recordsInSchedule = records.filter(record =>
      record.checkin_date >= schedule.start_date &&
      record.checkin_date <= schedule.end_date
    )

    const totalDays = recordsInSchedule.length

    // 计算当月打卡天数（在打卡周期内）
    const beijingToday = getBeijingDateString()
    const currentYear = parseInt(beijingToday.split('-')[0])
    const currentMonth = parseInt(beijingToday.split('-')[1])
    const currentMonthDays = recordsInSchedule.filter(record => {
      const recordDate = new Date(record.checkin_date)
      return recordDate.getFullYear() === currentYear && recordDate.getMonth() + 1 === currentMonth
    }).length

    // 计算完成率（基于90天目标，不是93天周期）
    const targetDays = 90
    const completionRate = targetDays > 0 ? (totalDays / targetDays) * 100 : 0

    return {
      total_days: totalDays,
      consecutive_days: 0, // 需要计算连续天数
      current_month_days: currentMonthDays,
      completion_rate: Math.round(completionRate * 100) / 100
    }
  }

  // 生成日历数据 - 按月显示真实日历，全程使用北京时间
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // 基于北京时间计算日历
    const beijingNow = new Date()
    const beijingToday = getBeijingDateString(beijingNow)
    
    // 获取当月第一天（基于当前选择的年月）
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // 从周日开始

    const days = []
    const current = new Date(startDate)

    // 详细的时间调试信息
    const now = new Date()
    const beijingTimeNew = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Shanghai"}))
    const beijingDateStrNew = `${beijingTimeNew.getFullYear()}-${String(beijingTimeNew.getMonth() + 1).padStart(2, '0')}-${String(beijingTimeNew.getDate()).padStart(2, '0')}`

    console.log('🗓️ 日历生成调试信息:', {
      当前选择年月: `${year}-${month + 1}`,
      系统本地时间: now.toISOString(),
      系统本地时间字符串: now.toString(),
      系统时区: Intl.DateTimeFormat().resolvedOptions().timeZone,
      系统时区偏移: now.getTimezoneOffset(),
      新方法北京时间: beijingTimeNew.toString(),
      新方法北京日期: beijingDateStrNew,
      工具函数北京时间今天: beijingToday,
      是否一致: beijingDateStrNew === beijingToday,
      日历开始日期: startDate.toISOString().split('T')[0]
    })

    for (let i = 0; i < 42; i++) { // 6周 x 7天
      // 使用北京时间格式化日期字符串
      const dateStr = getBeijingDateString(current)
      const isCurrentMonth = current.getMonth() === month
      const isToday = dateStr === beijingToday
      const checkinRecord = checkinRecords.find(record => record.checkin_date === dateStr)

      console.log(`📅 日历格子 ${current.getDate()}: ${dateStr}, 是今天: ${isToday}, 有打卡: ${!!checkinRecord}`);

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
        canCheckin: isToday && isInSchedule, // 只有今天且在打卡周期内才能打卡
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
    console.log('🚀 [前端] 开始提交打卡')

    if (!xiaohongshuUrl.trim()) {
      console.log('❌ [前端] 小红书链接为空')
      setMessage('请输入小红书链接')
      return
    }

    if (!xiaohongshuUrl.includes('xiaohongshu.com') && !xiaohongshuUrl.includes('xhslink.com')) {
      console.log('❌ [前端] 小红书链接格式无效:', xiaohongshuUrl)
      setMessage('请输入有效的小红书链接')
      return
    }

    setLoading(true)
    setMessage('')

    const requestData = {
      student_id: studentId,
      urls: [xiaohongshuUrl],
      date: selectedDate
    }
    console.log('📤 [前端] 发送请求数据:', JSON.stringify(requestData, null, 2))

    try {
      const response = await fetch('/api/checkin/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      console.log('📥 [前端] 收到响应状态:', response.status, response.statusText)
      const result = await response.json()
      console.log('📥 [前端] 收到响应数据:', JSON.stringify(result, null, 2))

      if (response.ok && result.success) {
        console.log('✅ [前端] 打卡提交成功')
        setMessage('✅ 打卡提交成功！日历已更新')

        // 立即刷新打卡数据，确保UI同步更新
        console.log('🔄 [前端] 刷新打卡数据')
        await fetchCheckinData()

        // 立即更新本地打卡记录状态，确保日历颜色立即变化
        const newRecord: CheckinRecord = {
          id: result.data?.id || Date.now().toString(),
          student_id: studentId,
          student_name: userName,
          checkin_date: selectedDate,
          xiaohongshu_url: xiaohongshuUrl,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        console.log('🔄 [前端] 更新本地打卡记录:', newRecord)

        // 更新本地记录
        setCheckinRecords(prev => {
          const filtered = prev.filter(r => r.checkin_date !== selectedDate)
          return [newRecord, ...filtered].sort((a, b) =>
            new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime()
          )
        })

        // 延迟关闭模态框，让用户看到成功消息和绿色效果
        setTimeout(() => {
          setShowCheckinModal(false)
          setMessage('')
        }, 2000)
      } else {
        console.log('❌ [前端] 打卡提交失败:', result.error)
        setMessage(result.error || '提交失败，请重试')
      }
    } catch (error) {
      console.error('💥 [前端] 提交打卡失败:', error)
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
  if (hasXiaohongshuProfile && !hasCheckinSchedule && !showNoScheduleModal && !showSelfScheduleModal) {
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
              // 获取北京时间的今天日期
              const todayStr = getBeijingDateString()
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
              const today = getBeijingDateString()
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
              {(() => {
                const todayStr = getBeijingDateString()
                const startDate = new Date(checkinSchedule.start_date)
                const today = new Date(todayStr)

                // 计算当前是第几天
                const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                const currentDay = Math.max(1, daysDiff) // 确保至少是第1天

                // 根据天数生成不同的鼓励话语
                const getEncouragementMessage = (day: number) => {
                  if (day === 1) {
                    return {
                      title: "🌟 新的开始！",
                      message: "✨ 每一个伟大的成就都始于勇敢的开始！相信自己，坚持下去，您一定能创造属于自己的精彩！💪"
                    }
                  } else if (day <= 7) {
                    return {
                      title: "🚀 起步阶段！",
                      message: "🌱 万事开头难，您已经迈出了最重要的第一步！继续保持这份热情和坚持，好习惯正在养成中！"
                    }
                  } else if (day <= 21) {
                    return {
                      title: "💪 习惯养成中！",
                      message: "🔥 科学研究表明，21天可以养成一个习惯！您正在朝着目标稳步前进，每一天的坚持都在为成功积累力量！"
                    }
                  } else if (day <= 30) {
                    return {
                      title: "🏆 坚持有成！",
                      message: "⭐ 一个月的坚持，证明了您的毅力和决心！您已经超越了很多人，继续保持这份优秀！"
                    }
                  } else if (day <= 60) {
                    return {
                      title: "🌟 持续精进！",
                      message: "🎯 两个月的坚持，您已经成为了自律的典范！每一天的积累都在让您变得更加优秀！"
                    }
                  } else if (day <= 90) {
                    return {
                      title: "👑 接近胜利！",
                      message: "🏅 您已经走过了大部分的路程，胜利就在前方！坚持到底，您将收获满满的成就感！"
                    }
                  } else {
                    return {
                      title: "🎉 超越目标！",
                      message: "🌈 您已经超越了既定目标，这份坚持和毅力值得所有人的敬佩！继续保持这份优秀！"
                    }
                  }
                }

                const encouragement = getEncouragementMessage(currentDay)

                return (
                  <>
                    <h3 className="text-xl font-bold text-white mb-4">{encouragement.title}</h3>
                    <div className="text-white/80 mb-6">
                      <div className="text-lg font-medium text-yellow-300 mb-3">
                        📅 今天是您打卡的第 <span className="text-2xl font-bold">{currentDay}</span> 天
                      </div>
                      <p className="mb-4">
                        您的打卡周期从 <span className="text-blue-300 font-medium">{checkinSchedule.start_date}</span> 开始，
                        到 <span className="text-blue-300 font-medium">{checkinSchedule.end_date}</span> 结束。
                      </p>
                      <p className="text-yellow-300 font-medium">
                        {encouragement.message}
                      </p>
                    </div>
                  </>
                )
              })()}
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

        {/* 打卡已结束的提示模态框 */}
        {showCheckinEndedModal && checkinSchedule && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-8 rounded-xl border border-white/20 max-w-md w-full text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-4">您的打卡已经结束</h3>
              <p className="text-white/80 mb-4">
                打卡周期：{checkinSchedule.start_date} 至 {checkinSchedule.end_date}
              </p>
              <p className="text-white/60 mb-6">
                点击下方按钮查看您的打卡详情
              </p>
              <button
                onClick={() => {
                  setShowCheckinEndedModal(false)
                  router.push(`/checkin-details?student_id=${studentId}`)
                }}
                className="px-6 py-2 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 hover:text-purple-200 rounded-lg transition-all duration-300"
              >
                查看打卡详情
              </button>
            </div>
          </div>
        )}

        {/* 自主设定权限提示模态框 */}
        {showSelfScheduleModal && selfScheduleStatus && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-8 rounded-xl border border-white/20 max-w-lg w-full text-center">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold text-white mb-4">您可以自主设定打卡时间</h3>
              <p className="text-white/80 mb-6 leading-relaxed">
                您可以在 <span className="text-blue-300 font-medium">{selfScheduleStatus.deadline}</span> 前设置您的打卡开始时间，
                <span className="text-red-300 font-medium">有且只有一次设置机会</span>，
                一旦设置之后，93天内完成90次打卡，则算合格，可以退还课程保证金，
                如果不合格，则无法退还，请珍惜机会。
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowSelfScheduleModal(false)
                    setShowSelfScheduleSetupModal(true)
                  }}
                  className="flex-1 px-6 py-3 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 rounded-lg transition-all duration-300 font-medium"
                >
                  确认设置打卡时间
                </button>
                <button
                  onClick={() => {
                    setShowSelfScheduleModal(false)
                    router.push('/')
                  }}
                  className="flex-1 px-6 py-3 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 hover:text-gray-200 rounded-lg transition-all duration-300"
                >
                  我再想想先返回
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 自主设定打卡时间设置模态框 */}
        {showSelfScheduleSetupModal && selfScheduleStatus && (
          <SelfScheduleSetupModal
            selfScheduleStatus={selfScheduleStatus}
            studentId={studentId}
            onClose={() => setShowSelfScheduleSetupModal(false)}
            onSuccess={() => {
              setShowSelfScheduleSetupModal(false)
              // 重新检查打卡安排
              checkCheckinSchedule(studentId)
            }}
          />
        )}
      </div>
    </div>
  )
}

// 自主设定打卡时间设置模态框组件
function SelfScheduleSetupModal({
  selfScheduleStatus,
  studentId,
  onClose,
  onSuccess
}: {
  selfScheduleStatus: any
  studentId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<'tutorial' | 'setup'>('tutorial')
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSetSchedule = async () => {
    if (!selectedDate) {
      setMessage('请选择打卡开始日期')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/student/self-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentId}`
        },
        body: JSON.stringify({
          start_date: selectedDate
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage(`✅ ${data.message}`)
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        const errorData = await response.json()
        setMessage(`❌ ${errorData.error}`)
      }
    } catch (error) {
      console.error('设置打卡时间失败:', error)
      setMessage('❌ 网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-effect p-8 rounded-xl border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {step === 'tutorial' ? (
          <>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-xl font-bold text-white mb-4">打卡教程须知</h3>
              <p className="text-white/80 mb-6">
                请先阅读完整的打卡教程，了解打卡规则和要求
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <a
                href="https://pcnxm41ut6t0.feishu.cn/wiki/QCCGwbgmuifXVRkIwKvc7ZPsnib?from=from_copylink"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 text-blue-300 hover:text-blue-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>点击阅读打卡教程须知</span>
              </a>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 hover:text-gray-200 rounded-lg transition-all duration-300"
              >
                取消
              </button>
              <button
                onClick={() => setStep('setup')}
                className="flex-1 px-6 py-3 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 rounded-lg transition-all duration-300"
              >
                我已阅读完成，继续设置
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-white mb-4">设置打卡开始时间</h3>
              <p className="text-white/80 mb-2">
                请选择您的打卡开始日期（93天内完成90次打卡）
              </p>
              <p className="text-red-300 text-sm">
                ⚠️ 只有一次设置机会，设置后不可修改，请慎重选择
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-2">
                打卡开始日期
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={selfScheduleStatus.date_range?.earliest}
                max={selfScheduleStatus.date_range?.latest}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
              />
              <p className="text-white/50 text-xs mt-1">
                可选择范围：{selfScheduleStatus.date_range?.earliest} 至 {selfScheduleStatus.date_range?.latest}
              </p>
            </div>

            {message && (
              <div className="mb-4 p-3 bg-white/10 rounded-lg">
                <p className="text-white/80 text-sm">{message}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setStep('tutorial')}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 hover:text-gray-200 rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                返回
              </button>
              <button
                onClick={handleSetSchedule}
                disabled={loading || !selectedDate}
                className="flex-1 px-6 py-3 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '设置中...' : '确认设置'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
