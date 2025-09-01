'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import Link from 'next/link'
import AddStudentModal from '../components/AddStudentModal'
import GlobalUserMenu from '../components/GlobalUserMenu'
import { getBeijingDateString } from '@/lib/date-utils'

interface Student {
  id: string
  student_id: string
  name: string
  email?: string
  role: string
  created_at: string
  punch_count?: number
}

interface AdminStats {
  totalStudents: number
  activePunches: number
  qualifiedStudents: number
  notStartedStudents: number
  forgotStudents: number
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    activePunches: 0,
    qualifiedStudents: 0,
    notStartedStudents: 0,
    forgotStudents: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'student_id' | 'name' | 'real_name'>('student_id')
  const [showStudentManagement, setShowStudentManagement] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCheckinManagement, setShowCheckinManagement] = useState(false)
  const [checkinType, setCheckinType] = useState<'qualified' | 'not_started' | 'forgot'>('qualified')
  const [checkinStudents, setCheckinStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [showStudentDetail, setShowStudentDetail] = useState(false)

  // 权限检查
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }
  }, [user, isAdmin, router])

  // 加载数据
  useEffect(() => {
    if (isAdmin) {
      loadDashboardData()
    }
  }, [isAdmin])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // 加载学员列表
      const studentsResponse = await fetch('/api/admin/students')
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setStudents(studentsData.students || [])

        // 计算统计数据
        const totalStudents = studentsData.students?.filter((s: Student) => s.role === 'student').length || 0

        setStats(prev => ({
          ...prev,
          totalStudents
        }))
      }

      // 加载打卡统计数据
      const checkinStatsResponse = await fetch('/api/admin/checkin-stats')
      if (checkinStatsResponse.ok) {
        const checkinStatsData = await checkinStatsResponse.json()
        setStats(prev => ({
          ...prev,
          activePunches: checkinStatsData.activePunches || 0,
          qualifiedStudents: checkinStatsData.qualifiedStudents || 0,
          notStartedStudents: checkinStatsData.notStartedStudents || 0,
          forgotStudents: checkinStatsData.forgotStudents || 0
        }))
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 过滤学员 - 支持三种搜索方式
  const filteredStudents = students.filter(student => {
    if (!searchTerm.trim()) return true

    const searchLower = searchTerm.toLowerCase()
    switch (searchType) {
      case 'student_id':
        return student.student_id.toLowerCase().includes(searchLower)
      case 'name':
        return student.name.toLowerCase().includes(searchLower)
      case 'real_name':
        return (student as any).real_name?.toLowerCase().includes(searchLower) || false
      default:
        return true
    }
  })

  // 加载打卡管理数据
  const loadCheckinData = async (type: 'qualified' | 'not_started' | 'forgot') => {
    try {
      setLoading(true)

      // 获取所有打卡时间安排
      const scheduleResponse = await fetch('/api/admin/checkin-schedule')
      if (!scheduleResponse.ok) {
        throw new Error('Failed to fetch schedule')
      }
      const scheduleData = await scheduleResponse.json()
      const schedules = scheduleData.data || []

      // 获取所有学员的打卡记录
      const recordsResponse = await fetch('/api/checkin/records')
      if (!recordsResponse.ok) {
        throw new Error('Failed to fetch records')
      }
      const recordsData = await recordsResponse.json()

      // 获取所有学员信息
      const studentsResponse = await fetch('/api/admin/students')
      if (!studentsResponse.ok) {
        throw new Error('Failed to fetch students')
      }
      const studentsData = await studentsResponse.json()
      const allStudents = studentsData.students.filter((s: any) => s.role === 'student')

      const now = new Date()

      // 计算每个学员的打卡状态
      const studentStats = allStudents.map((student: any) => {
        // 找到该学员的打卡安排
        const studentSchedule = schedules.find((s: any) => s.student_id === student.student_id)

        if (!studentSchedule) {
          // 没有打卡安排的学员，使用默认值
          return {
            ...student,
            checkinDays: 0,
            totalDays: 90,
            completionRate: 0,
            status: 'active',
            records: []
          }
        }

        const startDate = new Date(studentSchedule.start_date)
        const endDate = new Date(studentSchedule.end_date)
        const studentRecords = recordsData.records.filter((r: any) => r.student_id === student.student_id)

        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        const checkinDays = studentRecords.length
        const completionRate = totalDays > 0 ? (checkinDays / totalDays) * 100 : 0

        // 根据新的三种状态分类：打卡合格、未打卡、忘记打卡
        let status = 'qualified' // 默认为合格

        if (now > endDate) {
          // 打卡期已结束，根据完成率判断
          status = completionRate >= 80 ? 'qualified' : 'unqualified'
        } else {
          // 打卡期进行中，检查是否有忘记打卡的情况
          const today = getBeijingDateString()
          const daysSinceStart = Math.ceil((new Date(today).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

          if (daysSinceStart > 0 && checkinDays < daysSinceStart) {
            // 有忘记打卡的天数
            status = 'forgot'
          } else if (checkinDays === 0) {
            // 还没有开始打卡
            status = 'not_started'
          } else {
            // 正常打卡中
            status = 'qualified'
          }
        }

        return {
          ...student,
          checkinDays,
          totalDays,
          completionRate: Math.round(completionRate),
          status,
          records: studentRecords,
          schedule: studentSchedule
        }
      })

      // 根据类型过滤学员
      const filteredStudents = studentStats.filter((s: any) => s.status === type)
      setCheckinStudents(filteredStudents)

    } catch (error) {
      console.error('Failed to load checkin data:', error)
      setCheckinStudents([])
    } finally {
      setLoading(false)
    }
  }

  // 编辑学员
  const handleEditStudent = (student: Student) => {
    // 跳转到学员资料设置界面
    const editUrl = `/profile?edit=true&student_id=${student.student_id}&name=${encodeURIComponent(student.name)}&real_name=${encodeURIComponent((student as any).real_name || '')}`
    window.open(editUrl, '_blank')
  }

  // 查看学员打卡详情
  const handleViewStudentDetail = (student: any) => {
    setSelectedStudent(student)
    setShowStudentDetail(true)
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* 全局用户菜单 - 左上角 */}
      <GlobalUserMenu className="absolute top-6 left-6 z-50" />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            ⚙️ 管理员后台
          </h1>
          <p className="text-white/70">
            欢迎回来，{user?.name}！管理学员信息和系统运营数据。
          </p>
        </div>

        {/* 条件渲染：统计面板、学员管理或打卡管理 */}
        {!showStudentManagement && !showCheckinManagement ? (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="glass-effect p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">👥</div>
                    <div>
                      <p className="text-white/60 text-sm">总学员数</p>
                      <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowStudentManagement(true)}
                  className="w-full px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 rounded-lg transition-all duration-300 text-sm"
                >
                  进入管理
                </button>
              </div>

              <div className="glass-effect p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">✅</div>
                    <div>
                      <p className="text-white/60 text-sm">打卡合格人数</p>
                      <p className="text-2xl font-bold text-white">{stats.qualifiedStudents}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCheckinType('qualified')
                    setShowCheckinManagement(true)
                    loadCheckinData('qualified')
                  }}
                  className="w-full px-4 py-2 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200 rounded-lg transition-all duration-300 text-sm"
                >
                  进入管理
                </button>
              </div>

              <div className="glass-effect p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">⏳</div>
                    <div>
                      <p className="text-white/60 text-sm">未打卡人数</p>
                      <p className="text-2xl font-bold text-white">{stats.notStartedStudents}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCheckinType('not_started')
                    setShowCheckinManagement(true)
                    loadCheckinData('not_started')
                  }}
                  className="w-full px-4 py-2 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 hover:text-gray-200 rounded-lg transition-all duration-300 text-sm"
                >
                  进入管理
                </button>
              </div>

              <div className="glass-effect p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">😴</div>
                    <div>
                      <p className="text-white/60 text-sm">忘记打卡人数</p>
                      <p className="text-2xl font-bold text-white">{stats.forgotStudents}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCheckinType('forgot')
                    setShowCheckinManagement(true)
                    loadCheckinData('forgot')
                  }}
                  className="w-full px-4 py-2 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 hover:text-orange-200 rounded-lg transition-all duration-300 text-sm"
                >
                  进入管理
                </button>
              </div>
            </div>
          </>
        ) : showStudentManagement ? (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setShowStudentManagement(false)}
                className="mr-4 p-2 text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-3xl font-bold text-white">👥 学员管理</h2>
            </div>
            
            <div className="glass-effect p-6 rounded-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">👥 学员管理</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="cosmic-button px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    ➕ 新增学员
                  </button>
                </div>
              </div>

              {/* 搜索区域 */}
              <div className="mb-4 space-y-3">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSearchType('student_id')}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      searchType === 'student_id'
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    按学号
                  </button>
                  <button
                    onClick={() => setSearchType('name')}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      searchType === 'name'
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    按昵称
                  </button>
                  <button
                    onClick={() => setSearchType('real_name')}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      searchType === 'real_name'
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    按真实姓名
                  </button>
                </div>

                <input
                  type="text"
                  placeholder={`搜索学员（${
                    searchType === 'student_id' ? '学号' :
                    searchType === 'name' ? '昵称' : '真实姓名'
                  }）...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* 学员列表 */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-white/60">加载中...</div>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-white/60">暂无学员数据</div>
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {student.role === 'admin' ? '👑' : '👤'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{student.name}</p>
                          <p className="text-white/60 text-sm">{student.student_id}</p>
                          {student.email && (
                            <p className="text-white/50 text-xs">{student.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          student.role === 'admin'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {student.role === 'admin' ? '管理员' : '学员'}
                        </span>
                        <button
                          onClick={() => handleEditStudent(student)}
                          className="text-white/60 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10"
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : showCheckinManagement ? (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6">
              <button
                onClick={() => {
                  setShowCheckinManagement(false)
                  setShowStudentDetail(false)
                  setSelectedStudent(null)
                }}
                className="mr-4 p-2 text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-3xl font-bold text-white">
                📊 {checkinType === 'qualified' ? '打卡合格学员' :
                     checkinType === 'not_started' ? '未打卡学员' :
                     checkinType === 'forgot' ? '忘记打卡学员' : '学员管理'}
              </h2>
            </div>

            {!showStudentDetail ? (
              <div className="glass-effect p-6 rounded-xl">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    {checkinType === 'qualified' ? '✅ 打卡合格的学员列表' :
                     checkinType === 'not_started' ? '⏳ 未打卡的学员列表' :
                     checkinType === 'forgot' ? '😴 忘记打卡的学员列表' : '学员列表'}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {checkinType === 'qualified' ? '这些学员已完成打卡要求（完成率≥80%）' :
                     checkinType === 'not_started' ? '这些学员还没有开始打卡' :
                     checkinType === 'forgot' ? '这些学员有忘记打卡的情况' : '学员管理'}
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="text-white/60">加载中...</div>
                    </div>
                  ) : checkinStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-white/60">暂无相关学员</div>
                    </div>
                  ) : (
                    checkinStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">👤</div>
                          <div>
                            <p className="text-white font-medium">{student.name}</p>
                            <p className="text-white/60 text-sm">学号：{student.student_id}</p>
                            {(student as any).real_name && (
                              <p className="text-white/60 text-sm">真实姓名：{(student as any).real_name}</p>
                            )}
                            <p className="text-white/50 text-xs">
                              打卡进度：{student.checkinDays}/{student.totalDays} 天
                              ({student.completionRate}%)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            student.status === 'qualified' ? 'bg-green-500/20 text-green-300' :
                            student.status === 'not_started' ? 'bg-gray-500/20 text-gray-300' :
                            student.status === 'forgot' ? 'bg-orange-500/20 text-orange-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {student.status === 'qualified' ? '✅ 合格' :
                             student.status === 'not_started' ? '⏳ 未开始' :
                             student.status === 'forgot' ? '😴 忘记打卡' :
                             '📊 其他'}
                          </span>
                          <button
                            onClick={() => handleViewStudentDetail(student)}
                            className="text-white/60 hover:text-white text-sm px-3 py-1 rounded hover:bg-white/10"
                          >
                            查看详情
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-effect p-6 rounded-xl">
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setShowStudentDetail(false)}
                    className="mr-4 p-2 text-white/70 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedStudent?.name} 的打卡详情</h3>
                    <p className="text-white/60">学号：{selectedStudent?.student_id}</p>
                    {(selectedStudent as any)?.real_name && (
                      <p className="text-white/60">真实姓名：{(selectedStudent as any).real_name}</p>
                    )}
                  </div>
                </div>

                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-2">📊 打卡统计</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">{selectedStudent?.checkinDays}</p>
                      <p className="text-white/60 text-sm">已打卡天数</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{selectedStudent?.totalDays}</p>
                      <p className="text-white/60 text-sm">总天数</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{selectedStudent?.completionRate}%</p>
                      <p className="text-white/60 text-sm">完成率</p>
                    </div>
                  </div>
                </div>

                {/* 打卡日历视图 */}
                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-4">📅 打卡日历</h4>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {/* 星期标题 */}
                    {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                      <div key={day} className="p-2 text-white/60 font-medium">{day}</div>
                    ))}

                    {/* 生成日历格子 */}
                    {(() => {
                      if (!selectedStudent?.schedule) return null

                      const startDate = new Date(selectedStudent.schedule.start_date)
                      const endDate = new Date(selectedStudent.schedule.end_date)
                      const checkinDates = new Set(selectedStudent.records?.map((r: any) => r.checkin_date) || [])

                      // 生成日历天数
                      const calendarDays = []
                      const firstDay = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
                      const lastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0)

                      // 填充月初空白
                      const startWeekday = firstDay.getDay()
                      for (let i = 0; i < startWeekday; i++) {
                        calendarDays.push(<div key={`empty-${i}`} className="p-2"></div>)
                      }

                      // 填充日期
                      const current = new Date(firstDay)
                      while (current <= lastDay) {
                        const dateStr = getBeijingDateString(current)
                        const isInRange = dateStr >= selectedStudent.schedule.start_date && dateStr <= selectedStudent.schedule.end_date
                        const hasCheckin = checkinDates.has(dateStr)
                        const isPast = dateStr < getBeijingDateString()

                        let bgClass = 'bg-gray-500/20'
                        let textClass = 'text-white/30'

                        if (isInRange) {
                          if (hasCheckin) {
                            bgClass = 'bg-green-500/30'
                            textClass = 'text-green-300'
                          } else if (isPast) {
                            bgClass = 'bg-red-500/30'
                            textClass = 'text-red-300'
                          } else {
                            bgClass = 'bg-gray-500/20'
                            textClass = 'text-white/60'
                          }
                        }

                        calendarDays.push(
                          <div key={dateStr} className={`p-2 rounded text-xs ${bgClass} ${textClass} relative`}>
                            {current.getDate()}
                            {hasCheckin && <div className="absolute top-0 right-0 text-xs">✅</div>}
                          </div>
                        )

                        current.setDate(current.getDate() + 1)
                      }

                      return calendarDays
                    })()}
                  </div>

                  {/* 图例 */}
                  <div className="mt-4 flex justify-center flex-wrap gap-4 text-xs text-white/70">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500/30 rounded mr-2"></div>
                      已打卡
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500/30 rounded mr-2"></div>
                      忘记打卡
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-500/20 rounded mr-2"></div>
                      未到时间
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-white mb-4">📝 打卡记录</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedStudent?.records?.length === 0 ? (
                      <div className="text-center py-4 text-white/60">暂无打卡记录</div>
                    ) : (
                      selectedStudent?.records?.map((record: any, index: number) => (
                        <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-white font-medium">
                              {new Date(record.checkin_date).toLocaleDateString('zh-CN')}
                            </span>
                            <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300">
                              ✅ 已打卡
                            </span>
                          </div>
                          {record.xiaohongshu_url && (
                            <a
                              href={record.xiaohongshu_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm break-all"
                            >
                              🔗 {record.xiaohongshu_url}
                            </a>
                          )}
                          {record.admin_comment && (
                            <div className="mt-2 p-2 bg-white/5 rounded text-sm text-white/70">
                              <span className="text-white/50">管理员备注：</span>
                              {record.admin_comment}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* 新增学员模态框 */}
        <AddStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadDashboardData}
        />
      </div>
    </div>
  )
}
