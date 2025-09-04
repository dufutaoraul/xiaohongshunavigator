'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function SelfScheduleSetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('student_id')

  const [selectedDate, setSelectedDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null)
  const [minDate, setMinDate] = useState('')
  const [maxDate, setMaxDate] = useState('')

  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/user?student_id=${studentId}`)
      if (response.ok) {
        const userData = await response.json()
        const createdAt = userData.user?.created_at

        if (createdAt) {
          setUserCreatedAt(createdAt)

          // 设置最小日期为今天
          const today = new Date()
          const todayStr = today.toISOString().split('T')[0]
          setMinDate(todayStr)

          // 设置最大日期为用户创建日期的6个月后
          const createdDate = new Date(createdAt)
          const maxAllowedDate = new Date(createdDate)
          maxAllowedDate.setMonth(maxAllowedDate.getMonth() + 6)
          const maxDateStr = maxAllowedDate.toISOString().split('T')[0]
          setMaxDate(maxDateStr)

          // 设置默认日期为今天
          setSelectedDate(todayStr)
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 如果获取失败，设置默认值
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      setMinDate(todayStr)
      setSelectedDate(todayStr)

      // 设置默认6个月后的日期
      const maxDefault = new Date()
      maxDefault.setMonth(maxDefault.getMonth() + 6)
      setMaxDate(maxDefault.toISOString().split('T')[0])
    }
  }, [studentId])

  // 获取用户信息并设置日期限制
  useEffect(() => {
    if (studentId) {
      fetchUserInfo()
    }
  }, [studentId, fetchUserInfo])

  const handleSave = async () => {
    if (!studentId) {
      alert('学生ID不能为空')
      return
    }

    if (!selectedDate) {
      alert('请选择打卡开始日期')
      return
    }

    // 验证日期是否在允许范围内
    const selectedDateObj = new Date(selectedDate)
    const minDateObj = new Date(minDate)
    const maxDateObj = new Date(maxDate)

    if (selectedDateObj < minDateObj || selectedDateObj > maxDateObj) {
      alert('选择的日期超出允许范围，请重新选择')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/checkin-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'single',
          student_id: studentId,
          start_date: selectedDate,
          created_by: studentId, // 自主设置时，创建者就是学员自己
          force_update: true // 允许覆盖现有设置
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // 保存设置成功的状态到localStorage
        localStorage.setItem(`schedule_set_${studentId}`, JSON.stringify({
          startDate: selectedDate,
          setAt: new Date().toISOString()
        }))

        alert('打卡开始日期设置成功！')
        router.push(`/checkin?student_id=${studentId}`)
      } else {
        alert(`设置失败: ${result.error || result.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('设置打卡开始日期失败:', error)
      alert('设置失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen relative">
      {/* 使用与首页一致的背景 */}
      <div className="cosmic-bg"></div>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-effect p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4 breathing-glow">⏰</div>
            <h1 className="text-2xl font-bold gradient-text mb-2">设置打卡时间</h1>
            <p className="text-white/70">选择您的打卡开始日期</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-3">
                选择打卡开始日期
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={minDate}
                max={maxDate}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
              />
              {minDate && maxDate && (
                <p className="text-white/50 text-xs mt-2">
                  可选择范围：{formatDate(minDate)} 至 {formatDate(maxDate)}
                </p>
              )}
            </div>

            <div className="glass-effect p-4 border border-yellow-500/30">
              <div className="flex items-start space-x-3">
                <div className="text-yellow-400 text-lg">⚠️</div>
                <div>
                  <p className="text-yellow-300 text-sm font-medium mb-1">重要提醒</p>
                  <p className="text-yellow-200/80 text-xs leading-relaxed">
                    选择后将开始为期93天的打卡计划，需完成90天打卡才能合格。请根据您的学习计划谨慎选择开始日期。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-lg transition-all duration-300 backdrop-blur-sm"
              >
                返回
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || !selectedDate}
                className="flex-1 cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '设置中...' : '确认设置'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SelfScheduleSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative">
        <div className="cosmic-bg"></div>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass-effect p-8 w-full max-w-md">
            <div className="text-center">
              <div className="text-5xl mb-4 breathing-glow">⏰</div>
              <h1 className="text-2xl font-bold gradient-text mb-2">加载中...</h1>
              <p className="text-white/70">正在初始化设置页面</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SelfScheduleSetupContent />
    </Suspense>
  )
}
