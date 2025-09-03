'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/app/components/Card'
import Button from '@/app/components/Button'

interface CheckinRecord {
  id: string
  student_id: string
  checkin_date: string
  xiaohongshu_url: string
  status: string
  created_at: string
  updated_at: string
  student_name?: string
}

interface CheckinSchedule {
  id: string
  student_id: string
  start_date: string
  end_date: string
  is_active: boolean
}

function CheckinDetailsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('student_id')

  const [loading, setLoading] = useState(true)
  const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([])
  const [checkinSchedule, setCheckinSchedule] = useState<CheckinSchedule | null>(null)
  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (studentId) {
      fetchCheckinDetails()
    } else {
      setError('缺少学员ID参数')
      setLoading(false)
    }
  }, [studentId])

  const fetchCheckinDetails = async () => {
    try {
      setLoading(true)
      setError('')

      // 获取学员信息
      const userResponse = await fetch(`/api/user?student_id=${studentId}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setStudentInfo(userData)
      }

      // 获取打卡安排
      const scheduleResponse = await fetch(`/api/admin/checkin-schedule?student_id=${studentId}`)
      const scheduleData = await scheduleResponse.json()
      
      if (scheduleData.success && scheduleData.data && scheduleData.data.length > 0) {
        setCheckinSchedule(scheduleData.data[0])
        
        // 获取打卡记录
        const recordsResponse = await fetch(`/api/checkin/records?student_id=${studentId}&limit=1000`)
        const recordsData = await recordsResponse.json()
        
        if (recordsData.success) {
          setCheckinRecords(recordsData.records || [])
        } else {
          setError('获取打卡记录失败')
        }
      } else {
        setError('该学员没有打卡安排')
      }
    } catch (error) {
      console.error('获取打卡详情失败:', error)
      setError('获取打卡详情失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    if (!checkinSchedule) return { totalDays: 0, checkinDays: 0, completionRate: 0 }

    const startDate = new Date(checkinSchedule.start_date)
    const endDate = new Date(checkinSchedule.end_date)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // 只计算在打卡周期内的记录
    const validRecords = checkinRecords.filter(record => 
      record.checkin_date >= checkinSchedule.start_date && 
      record.checkin_date <= checkinSchedule.end_date
    )
    
    const checkinDays = validRecords.length
    const completionRate = totalDays > 0 ? Math.round((checkinDays / totalDays) * 100) : 0

    return { totalDays, checkinDays, completionRate }
  }

  const isQualified = () => {
    if (!checkinSchedule) return false
    const { totalDays, checkinDays } = calculateStats()
    const actualPeriodDays = Math.min(93, totalDays)
    return checkinDays >= 90 && actualPeriodDays >= 90
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <Card className="text-center p-8 bg-white/10 backdrop-blur-sm border border-white/20">
          <div className="text-red-400 text-xl mb-4">❌ {error}</div>
          <Button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none"
          >
            返回
          </Button>
        </Card>
      </div>
    )
  }

  const stats = calculateStats()
  const qualified = isQualified()

  return (
    <div className="min-h-screen cosmic-bg">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* 头部信息 */}
        <div className="mb-8 text-center">
          <Button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none"
          >
            ← 返回
          </Button>

          <h1 className="text-4xl font-bold gradient-text mb-4">📊 打卡详情</h1>

          {studentInfo && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-md mx-auto">
              <h3 className="text-white font-medium mb-2">👤 学员信息</h3>
              <p className="text-white/70">姓名：{studentInfo.name}</p>
              <p className="text-white/70">学号：{studentInfo.student_id}</p>
              {studentInfo.real_name && (
                <p className="text-white/70">真实姓名：{studentInfo.real_name}</p>
              )}
            </div>
          )}
        </div>

        {/* 打卡统计 */}
        {checkinSchedule && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="text-center p-6 bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalDays}</div>
              <div className="text-white/70">总周期天数</div>
            </Card>

            <Card className="text-center p-6 bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="text-3xl font-bold text-green-400 mb-2">{stats.checkinDays}</div>
              <div className="text-white/70">已打卡天数</div>
            </Card>

            <Card className="text-center p-6 bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.completionRate}%</div>
              <div className="text-white/70">完成率</div>
            </Card>

            <Card className="text-center p-6 bg-white/10 backdrop-blur-sm border border-white/20">
              <div className={`text-3xl font-bold mb-2 ${qualified ? 'text-green-400' : 'text-red-400'}`}>
                {qualified ? '✅' : '❌'}
              </div>
              <div className="text-white/70">
                {qualified ? '打卡合格' : '打卡不合格'}
              </div>
            </Card>
          </div>
        )}

        {/* 打卡周期信息 */}
        {checkinSchedule && (
          <Card className="mb-8 p-6 bg-white/10 backdrop-blur-sm border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">📅 打卡周期</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-sm">开始日期</p>
                <p className="text-white font-medium">{formatDate(checkinSchedule.start_date)}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">结束日期</p>
                <p className="text-white font-medium">{formatDate(checkinSchedule.end_date)}</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg">
              <p className="text-purple-300 text-sm">
                💡 打卡标准：在93天周期内完成90次打卡即为合格
              </p>
            </div>
          </Card>
        )}

        {/* 打卡记录列表 */}
        <Card className="p-6 bg-white/10 backdrop-blur-sm border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">📝 打卡记录</h3>

          {checkinRecords.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {checkinRecords.map((record, index) => (
                <div key={record.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-white font-medium">
                          {formatDate(record.checkin_date)}
                        </span>
                        {/* 只显示有效和无效状态，不显示待审核 */}
                        {record.status === 'valid' && (
                          <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300">
                            ✅ 有效
                          </span>
                        )}
                        {record.status === 'invalid' && (
                          <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-300">
                            ❌ 无效
                          </span>
                        )}
                      </div>

                      {record.xiaohongshu_url && (
                        <a
                          href={record.xiaohongshu_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-400 hover:text-pink-300 text-sm break-all underline"
                        >
                          {record.xiaohongshu_url}
                        </a>
                      )}
                    </div>

                    <div className="text-white/40 text-xs">
                      第 {checkinRecords.length - index} 次打卡
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-white/60">暂无打卡记录</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function CheckinDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    }>
      <CheckinDetailsContent />
    </Suspense>
  )
}
