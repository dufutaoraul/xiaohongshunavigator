'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import GlobalUserMenu from '../components/GlobalUserMenu'
import DualCarousel from '../components/DualCarousel'

interface CheckinRecord {
  id: string
  student_id: string
  checkin_date: string
  xhs_url: string
  post_publish_time: string
  status: 'valid' | 'invalid' | 'pending'
  created_at: string
}

interface CheckinPlan {
  id: string
  student_id: string
  start_date: string
  end_date: string
  target_days: number
  completed_days: number
  status: 'active' | 'completed' | 'failed' | 'expired'
  created_at: string
}

export default function CheckinPage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [userName, setUserName] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // 打卡相关状态
  const [checkinPlan, setCheckinPlan] = useState<CheckinPlan | null>(null)
  const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([])
  const [showStartModal, setShowStartModal] = useState(false)
  const [selectedStartDate, setSelectedStartDate] = useState('')
  const [todayUrl, setTodayUrl] = useState('')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [isAccountValid, setIsAccountValid] = useState<boolean | null>(null)
  const [xiaohongshuUrl, setXiaohongshuUrl] = useState('')
  const [showXiaohongshuModal, setShowXiaohongshuModal] = useState(false)
  const [hasXiaohongshuProfile, setHasXiaohongshuProfile] = useState(false)

  // 检查用户认证状态
  useEffect(() => {
    const checkAuth = () => {
      const userSession = localStorage.getItem('userSession')
      if (userSession) {
        try {
          const session = JSON.parse(userSession)
          if (session.isAuthenticated) {
            setStudentId(session.student_id)
            setUserName(session.name)
            setIsAuthenticated(true)
          }
        } catch {
          // 忽略解析错误
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  // 获取打卡计划和记录
  useEffect(() => {
    if (isAuthenticated && studentId) {
      checkXiaohongshuProfile(studentId).then(hasProfile => {
        if (hasProfile) {
          fetchCheckinData()
          // 检查账号有效期
          checkAccountValidity().then(setIsAccountValid)
        }
      })
    }
  }, [isAuthenticated, studentId])

  const fetchCheckinData = async () => {
    try {
      // 获取打卡计划
      const { data: planData, error: planError } = await supabase
        .from('checkin_plans')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!planError && planData) {
        setCheckinPlan(planData)

        // 获取打卡记录
        const { data: recordsData, error: recordsError } = await supabase
          .from('checkin_records')
          .select('*')
          .eq('student_id', studentId)
          .eq('plan_id', planData.id)
          .order('checkin_date', { ascending: true })

        if (!recordsError && recordsData) {
          setCheckinRecords(recordsData)
        }
      }
    } catch (error) {
      console.error('获取打卡数据失败:', error)
    }
  }

  // 检查小红书主页绑定
  const checkXiaohongshuProfile = async (studentId: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('xiaohongshu_url')
        .eq('student_id', studentId)
        .single()

      if (error || !user) {
        console.error('获取用户信息失败:', error)
        setHasXiaohongshuProfile(false)
        return false
      }

      if (user.xiaohongshu_url) {
        setXiaohongshuUrl(user.xiaohongshu_url)
        setHasXiaohongshuProfile(true)
        return true
      } else {
        setHasXiaohongshuProfile(false)
        return false
      }
    } catch (error) {
      console.error('检查小红书主页失败:', error)
      setHasXiaohongshuProfile(false)
      return false
    }
  }

  // 更新小红书主页链接
  const updateXiaohongshuProfile = async (url: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ xiaohongshu_url: url })
        .eq('student_id', studentId)

      if (error) {
        console.error('更新小红书主页失败:', error)
        alert('更新失败，请重试')
        return false
      }

      setXiaohongshuUrl(url)
      setHasXiaohongshuProfile(true)
      setShowXiaohongshuModal(false)
      alert('小红书主页绑定成功！')
      return true
    } catch (error) {
      console.error('更新小红书主页失败:', error)
      alert('更新失败，请重试')
      return false
    }
  }

  // 生成日历天数
  const generateCalendarDays = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // 获取当月第一天和最后一天
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)

    // 获取第一天是星期几（0=周日）
    const firstDayWeek = firstDay.getDay()

    // 获取当月天数
    const daysInMonth = lastDay.getDate()

    const days = []

    // 添加上个月的天数（填充）
    const prevMonth = new Date(currentYear, currentMonth - 1, 0)
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        isToday: false,
        hasCheckin: false,
        isInvalid: false
      })
    }

    // 添加当月的天数
    for (let date = 1; date <= daysInMonth; date++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
      const record = checkinRecords.find(r => r.checkin_date === dateStr)

      days.push({
        date,
        isCurrentMonth: true,
        isToday: date === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear(),
        hasCheckin: record?.status === 'valid',
        isInvalid: record?.status === 'invalid'
      })
    }

    // 添加下个月的天数（填充到42天，6周）
    const remainingDays = 42 - days.length
    for (let date = 1; date <= remainingDays; date++) {
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        hasCheckin: false,
        isInvalid: false
      })
    }

    return days
  }

  // 检查账号有效期
  const checkAccountValidity = async () => {
    try {
      // 获取用户创建时间
      const { data: user, error } = await supabase
        .from('users')
        .select('created_at')
        .eq('student_id', studentId)
        .single()

      if (error || !user) {
        console.error('获取用户信息失败:', error)
        return false
      }

      const accountCreateTime = new Date(user.created_at)
      const sixMonthsLater = new Date(accountCreateTime.getTime() + 6 * 30 * 24 * 60 * 60 * 1000)
      const now = new Date()

      console.log('账号有效期检查:', {
        创建时间: accountCreateTime.toLocaleDateString(),
        有效期至: sixMonthsLater.toLocaleDateString(),
        当前时间: now.toLocaleDateString(),
        是否有效: now <= sixMonthsLater
      })

      return now <= sixMonthsLater
    } catch (error) {
      console.error('检查账号有效期失败:', error)
      return false // 出错时默认无效
    }
  }

  // 开始打卡计划
  const startCheckinPlan = async () => {
    if (!selectedStartDate) {
      alert('请选择开始日期')
      return
    }

    try {
      const startDate = new Date(selectedStartDate)
      const endDate = new Date(startDate.getTime() + 93 * 24 * 60 * 60 * 1000) // 93天后

      const { data, error } = await supabase
        .from('checkin_plans')
        .insert({
          student_id: studentId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          target_days: 90,
          completed_days: 0,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      setCheckinPlan(data)
      setShowStartModal(false)
      alert('打卡计划已开始！请坚持90天打卡，加油！')
    } catch (error) {
      console.error('创建打卡计划失败:', error)
      alert('创建打卡计划失败，请重试')
    }
  }

  // 检查毕业条件
  const checkGraduationCondition = async () => {
    try {
      // 获取最新的打卡记录
      const { data: records, error } = await supabase
        .from('checkin_records')
        .select('*')
        .eq('student_id', studentId)
        .eq('plan_id', checkinPlan?.id)
        .eq('status', 'valid')

      if (error) {
        console.error('获取打卡记录失败:', error)
        return
      }

      const validCheckins = records?.length || 0
      console.log(`当前有效打卡天数: ${validCheckins}/90`)

      // 检查是否达到90天
      if (validCheckins >= 90) {
        // 更新打卡计划状态为已完成
        const { error: updateError } = await supabase
          .from('checkin_plans')
          .update({
            status: 'completed',
            completed_days: validCheckins
          })
          .eq('id', checkinPlan?.id)

        if (updateError) {
          console.error('更新打卡计划状态失败:', updateError)
          return
        }

        // 发送通知给管理员
        await notifyAdminGraduation()

        // 显示恭喜消息
        alert(`🎉 恭喜您！您已完成90天打卡挑战！\n\n✅ 有效打卡天数: ${validCheckins}天\n🏆 您已获得毕业资格\n📧 管理员已收到通知，将为您颁发证书`)
      }
    } catch (error) {
      console.error('检查毕业条件失败:', error)
    }
  }

  // 通知管理员学员毕业
  const notifyAdminGraduation = async () => {
    try {
      // 这里可以发送邮件或其他通知方式
      // 暂时记录到数据库
      const { error } = await supabase
        .from('graduation_notifications')
        .insert({
          student_id: studentId,
          student_name: userName,
          graduation_date: new Date().toISOString(),
          checkin_plan_id: checkinPlan?.id,
          message: `学员 ${userName} (${studentId}) 已完成90天打卡挑战，请颁发毕业证书。`
        })

      if (error) {
        console.error('发送毕业通知失败:', error)
      } else {
        console.log('毕业通知已发送给管理员')
      }
    } catch (error) {
      console.error('发送毕业通知失败:', error)
    }
  }

  // 提交今日打卡
  const submitTodayCheckin = async () => {
    if (!todayUrl.trim()) {
      alert('请输入小红书链接')
      return
    }

    if (!todayUrl.includes('xiaohongshu.com')) {
      alert('请输入有效的小红书链接')
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]

      // 1. 先爬取帖子数据
      console.log('🕷️ 开始爬取帖子数据...')
      const crawlResponse = await fetch('/api/crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'crawl_post',
          student_id: studentId,
          post_url: todayUrl
        })
      })

      const crawlResult = await crawlResponse.json()

      if (!crawlResult.success) {
        console.error('爬取帖子数据失败:', crawlResult.error)
        // 即使爬取失败也继续打卡流程
      }

      // 2. 检查帖子发布时间是否在24小时内
      let isValidPost = true
      let postPublishTime = null

      if (crawlResult.success && crawlResult.data) {
        postPublishTime = crawlResult.data.publish_time
        const publishTime = new Date(postPublishTime)
        const now = new Date()
        const timeDiff = now.getTime() - publishTime.getTime()
        const hoursDiff = timeDiff / (1000 * 60 * 60)

        isValidPost = hoursDiff <= 24
        console.log('📅 帖子时间检查:', {
          发布时间: publishTime.toLocaleString(),
          当前时间: now.toLocaleString(),
          时间差: `${hoursDiff.toFixed(1)}小时`,
          是否有效: isValidPost
        })
      }

      // 3. 检查今天是否已经打卡
      const { data: existingRecord } = await supabase
        .from('checkin_records')
        .select('*')
        .eq('student_id', studentId)
        .eq('plan_id', checkinPlan?.id)
        .eq('checkin_date', today)
        .single()

      const recordData = {
        xhs_url: todayUrl,
        post_publish_time: postPublishTime,
        status: isValidPost ? 'valid' : 'invalid'
      }

      if (existingRecord) {
        // 更新今天的打卡记录
        const { error } = await supabase
          .from('checkin_records')
          .update(recordData)
          .eq('id', existingRecord.id)

        if (error) throw error
      } else {
        // 创建新的打卡记录
        const { error } = await supabase
          .from('checkin_records')
          .insert({
            student_id: studentId,
            plan_id: checkinPlan?.id,
            checkin_date: today,
            ...recordData
          })

        if (error) throw error
      }

      setTodayUrl('')
      setShowSubmitModal(false)

      // 重新获取打卡数据
      await fetchCheckinData()

      // 检查是否达到毕业条件
      await checkGraduationCondition()

      if (isValidPost) {
        alert('打卡提交成功！帖子时间有效。')
      } else {
        alert('打卡已提交，但帖子发布时间超过24小时，此次打卡无效。')
      }
    } catch (error) {
      console.error('提交打卡失败:', error)
      alert('提交打卡失败，请重试')
    }
  }

  if (loading || isAccountValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">请先登录</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            返回首页登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* 全局用户菜单 */}
      <GlobalUserMenu className="absolute top-6 left-6 z-50" />
      
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 pt-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-6">📊 打卡中心</h1>
          <p className="text-xl text-white/80">
            90天打卡挑战，坚持就是胜利！
          </p>
        </div>

        {!hasXiaohongshuProfile ? (
          <div className="glass-effect p-8 rounded-lg text-center">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">需要绑定小红书主页</h2>
            <p className="text-white/80 mb-6">
              请先绑定您的小红书主页链接，才能开始打卡挑战。
            </p>
            <button
              onClick={() => setShowXiaohongshuModal(true)}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg mr-4"
            >
              绑定小红书主页
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              返回首页
            </button>
          </div>
        ) : !isAccountValid ? (
          <div className="glass-effect p-8 rounded-lg text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">账号有效期已过</h2>
            <p className="text-white/80 mb-6">
              对不起，您的有效期已到，无法参加打卡退保证金活动，请联系管理员处理。
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              返回首页
            </button>
          </div>
        ) : !checkinPlan ? (
          <div className="glass-effect p-8 rounded-lg text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-white mb-4">开始你的打卡之旅</h2>
            <p className="text-white/80 mb-6">
              93天内打满90天，即可退还学费保证金！一旦开始就无法修改，请慎重考虑。
            </p>
            <button
              onClick={() => setShowStartModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold rounded-lg text-lg"
            >
              开始打卡计划
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 打卡进度概览 */}
            <div className="glass-effect p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">打卡进度</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{checkinRecords.filter(r => r.status === 'valid').length}</div>
                  <div className="text-white/60 text-sm">已完成</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{checkinRecords.filter(r => r.status === 'pending').length}</div>
                  <div className="text-white/60 text-sm">待审核</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">90</div>
                  <div className="text-white/60 text-sm">目标天数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {Math.max(0, Math.ceil((new Date(checkinPlan.end_date).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)))}
                  </div>
                  <div className="text-white/60 text-sm">剩余天数</div>
                </div>
              </div>
            </div>

            {/* 今日打卡 */}
            <div className="glass-effect p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">今日打卡</h3>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-lg"
              >
                📝 提交今日打卡
              </button>
            </div>

            {/* 打卡日历 */}
            <div className="glass-effect p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">打卡日历</h3>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                  <div key={day} className="text-center text-white/60 text-sm font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays().map((day, index) => (
                  <div
                    key={index}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-lg
                      ${day.isCurrentMonth ? 'text-white' : 'text-white/30'}
                      ${day.isToday ? 'bg-blue-500/30 border border-blue-400' : ''}
                      ${day.hasCheckin ? 'bg-green-500/30 border border-green-400' : 'bg-white/5'}
                      ${day.isInvalid ? 'bg-red-500/30 border border-red-400' : ''}
                    `}
                  >
                    {day.date}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500/30 border border-green-400 rounded"></div>
                  <span className="text-white/60">已打卡</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500/30 border border-red-400 rounded"></div>
                  <span className="text-white/60">无效打卡</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500/30 border border-blue-400 rounded"></div>
                  <span className="text-white/60">今天</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 轮播区域 - 只在有打卡计划时显示 */}
        {checkinPlan && (
          <div className="mt-12">
            <DualCarousel />
          </div>
        )}
      </div>

      {/* 开始打卡模态框 */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-white font-bold text-lg mb-4">选择开始日期</h3>
            <p className="text-white/80 text-sm mb-4">
              请选择打卡开始日期（可以是今天到半年内的任意一天）：
            </p>
            <input
              type="date"
              value={selectedStartDate}
              onChange={(e) => setSelectedStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={startCheckinPlan}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
              >
                确认开始
              </button>
              <button
                onClick={() => setShowStartModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 提交打卡模态框 */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-white font-bold text-lg mb-4">提交今日打卡</h3>
            <p className="text-white/80 text-sm mb-4">
              请输入您今天发布的小红书帖子链接：
            </p>
            <input
              type="url"
              value={todayUrl}
              onChange={(e) => setTodayUrl(e.target.value)}
              placeholder="https://www.xiaohongshu.com/explore/..."
              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={submitTodayCheckin}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                提交打卡
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 小红书主页绑定模态框 */}
      {showXiaohongshuModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-white font-bold text-lg mb-4">绑定小红书主页</h3>
            <p className="text-white/80 text-sm mb-4">
              请输入您的小红书主页链接：
            </p>
            <input
              type="url"
              value={xiaohongshuUrl}
              onChange={(e) => setXiaohongshuUrl(e.target.value)}
              placeholder="https://www.xiaohongshu.com/user/profile/..."
              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => updateXiaohongshuProfile(xiaohongshuUrl)}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                确认绑定
              </button>
              <button
                onClick={() => setShowXiaohongshuModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
