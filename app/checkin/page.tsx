'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import GlobalUserMenu from '../components/GlobalUserMenu'

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
      fetchCheckinData()
      // 检查账号有效期
      checkAccountValidity().then(setIsAccountValid)
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
      fetchCheckinData()

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

        {!isAccountValid ? (
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

            {/* 打卡日历 - 这里可以添加日历组件 */}
            <div className="glass-effect p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">打卡日历</h3>
              <p className="text-white/60">日历组件开发中...</p>
            </div>
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
    </div>
  )
}
