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
  const [showEditStudentModal, setShowEditStudentModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [checkinType, setCheckinType] = useState<'active' | 'qualified' | 'unqualified'>('active')
  const [checkinStudents, setCheckinStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [showStudentDetail, setShowStudentDetail] = useState(false)
  const [showCheckinScheduleModal, setShowCheckinScheduleModal] = useState(false)
  const [scheduleMode, setScheduleMode] = useState<'single' | 'batch'>('single')
  const [scheduleStudentId, setScheduleStudentId] = useState('')
  const [scheduleBatchStart, setScheduleBatchStart] = useState('')
  const [scheduleBatchEnd, setScheduleBatchEnd] = useState('')
  const [scheduleStartDate, setScheduleStartDate] = useState('')
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleMessage, setScheduleMessage] = useState('')
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([])

  // 自主设定权限管理相关状态
  const [showSelfScheduleManagement, setShowSelfScheduleManagement] = useState(false)
  const [selfScheduleStudents, setSelfScheduleStudents] = useState<any[]>([])
  const [selfScheduleLoading, setSelfScheduleLoading] = useState(false)
  const [selfScheduleMessage, setSelfScheduleMessage] = useState('')
  const [showSelfScheduleModal, setShowSelfScheduleModal] = useState(false)
  const [selfScheduleMode, setSelfScheduleMode] = useState<'individual' | 'range'>('individual')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [rangeStartId, setRangeStartId] = useState('')
  const [rangeEndId, setRangeEndId] = useState('')

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
        const allStudentsData = studentsData.students || []
        setStudents(allStudentsData)
        setAllStudents(allStudentsData)

        // 计算统计数据
        const totalStudents = allStudentsData.filter((s: Student) => s.role === 'student').length || 0

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
  const displayedStudents = students.filter(student => {
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
  // 加载自主设定权限数据
  const loadSelfScheduleData = async () => {
    try {
      setSelfScheduleLoading(true)
      const response = await fetch('/api/admin/self-schedule-permission', {
        headers: {
          'Authorization': `Bearer ${user?.student_id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSelfScheduleStudents(data.students || [])
      } else {
        setSelfScheduleMessage('加载自主设定权限数据失败')
      }
    } catch (error) {
      console.error('加载自主设定权限数据失败:', error)
      setSelfScheduleMessage('网络错误，请重试')
    } finally {
      setSelfScheduleLoading(false)
    }
  }

  const loadCheckinData = async (type: 'active' | 'qualified' | 'unqualified') => {
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
        const studentSchedule = schedules.find((s: any) => {
          return s.student_id === student.student_id
        })

        if (!studentSchedule) {
          // 没有打卡安排的学员，使用默认值
          return {
            ...student,
            checkinDays: 0,
            totalDays: 0,
            completionRate: 0,
            status: 'not_started',
            records: [],
            schedule: null
          }
        }

        const startDate = new Date(studentSchedule.start_date + 'T00:00:00')
        const endDate = new Date(studentSchedule.end_date + 'T23:59:59')

        // 获取学员的所有打卡记录（不限制日期范围）
        const studentRecords = recordsData.records.filter((r: any) =>
          r.student_id === student.student_id
        )

        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const checkinDays = studentRecords.length
        // 完成率基于90天目标计算，不是基于93天周期
        const targetDays = 90
        const completionRate = targetDays > 0 ? (checkinDays / targetDays) * 100 : 0

        // 使用北京时间进行状态判断
        const todayStr = getBeijingDateString()
        const todayDate = new Date(todayStr + 'T00:00:00')

        let status = 'active' // 默认为正在打卡

        if (todayDate > endDate) {
          // 打卡期已结束，根据93天内完成90次打卡的标准判断
          // 计算打卡周期的实际天数（最多93天）
          const actualPeriodDays = Math.min(93, totalDays)
          const isQualified = checkinDays >= 90 && actualPeriodDays >= 90
          status = isQualified ? 'qualified' : 'unqualified'

          console.log(`📊 [打卡合格判断] 学员 ${student.student_id}:`, {
            打卡天数: checkinDays,
            周期天数: actualPeriodDays,
            是否合格: isQualified,
            判断标准: '93天内完成90次打卡'
          })
        } else if (todayDate < startDate) {
          // 打卡期还未开始
          status = 'not_started'
        } else {
          // 打卡期进行中 - 正在打卡
          status = 'active'
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
      const checkinFilteredStudents = studentStats.filter((s: any) => s.status === type)

      // 添加调试信息
      console.log(`📊 [打卡数据加载] 类型: ${type}`, {
        总学员数: allStudents.length,
        有安排的学员数: studentStats.filter((s: any) => s.schedule).length,
        各状态学员数: {
          active: studentStats.filter((s: any) => s.status === 'active').length,
          qualified: studentStats.filter((s: any) => s.status === 'qualified').length,
          unqualified: studentStats.filter((s: any) => s.status === 'unqualified').length,
          not_started: studentStats.filter((s: any) => s.status === 'not_started').length
        },
        过滤后学员数: checkinFilteredStudents.length
      })

      setCheckinStudents(checkinFilteredStudents)

    } catch (error) {
      console.error('Failed to load checkin data:', error)
      setCheckinStudents([])
    } finally {
      setLoading(false)
    }
  }

  // 编辑学员
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setShowEditStudentModal(true)
  }

  // 更新学员信息
  const handleUpdateStudent = async (studentId: string, name: string) => {
    try {
      const response = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          name: name
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // 更新本地学员列表
        setStudents(prev => prev.map(s =>
          s.student_id === studentId ? { ...s, name } : s
        ))
        setShowEditStudentModal(false)
        setEditingStudent(null)
        return true
      } else {
        console.error('更新学员失败:', result.error)
        return false
      }
    } catch (error) {
      console.error('更新学员失败:', error)
      return false
    }
  }

  // 查看学员打卡详情
  const handleViewStudentDetail = (student: any) => {
    setSelectedStudent(student)
    setShowStudentDetail(true)
  }

  // 处理学员学号输入
  const handleStudentIdInput = (value: string) => {
    setScheduleStudentId(value)

    if (value.trim()) {
      // 过滤学员列表
      const filtered = allStudents.filter(student =>
        student.role === 'student' && (
          student.student_id.toLowerCase().includes(value.toLowerCase()) ||
          student.name.toLowerCase().includes(value.toLowerCase())
        )
      )
      setFilteredStudents(filtered)
      setShowStudentDropdown(true)
    } else {
      setShowStudentDropdown(false)
    }
  }

  // 选择学员
  const handleSelectStudent = (student: Student) => {
    setScheduleStudentId(student.student_id)
    setShowStudentDropdown(false)
  }

  // 移除自主设定权限
  const handleRemoveSelfSchedulePermission = async (studentIds: string[]) => {
    try {
      setSelfScheduleLoading(true)
      const response = await fetch('/api/admin/self-schedule-permission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.student_id}`
        },
        body: JSON.stringify({
          action: 'remove_permission',
          student_ids: studentIds
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSelfScheduleMessage(data.message)
        loadSelfScheduleData() // 重新加载数据
      } else {
        setSelfScheduleMessage('移除权限失败')
      }
    } catch (error) {
      console.error('移除自主设定权限失败:', error)
      setSelfScheduleMessage('网络错误，请重试')
    } finally {
      setSelfScheduleLoading(false)
    }
  }

  // 设置打卡日期
  const handleSetCheckinSchedule = async () => {
    if (!scheduleStartDate) {
      setScheduleMessage('请选择开始日期')
      return
    }

    if (scheduleMode === 'single' && !scheduleStudentId) {
      setScheduleMessage('请输入学员学号')
      return
    }

    if (scheduleMode === 'batch' && (!scheduleBatchStart || !scheduleBatchEnd)) {
      setScheduleMessage('请输入学号范围')
      return
    }

    setScheduleLoading(true)
    setScheduleMessage('')

    try {
      const requestBody = {
        mode: scheduleMode,
        start_date: scheduleStartDate,
        created_by: user?.student_id || 'admin'
      }

      if (scheduleMode === 'single') {
        Object.assign(requestBody, { student_id: scheduleStudentId })
      } else {
        Object.assign(requestBody, {
          batch_start_id: scheduleBatchStart,
          batch_end_id: scheduleBatchEnd
        })
      }

      const response = await fetch('/api/admin/checkin-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (result.success) {
        setScheduleMessage(`✅ ${result.message}`)
        // 清空表单
        setScheduleStudentId('')
        setScheduleBatchStart('')
        setScheduleBatchEnd('')
        setScheduleStartDate('')
        // 3秒后关闭模态框
        setTimeout(() => {
          setShowCheckinScheduleModal(false)
          setScheduleMessage('')
        }, 3000)
      } else if (result.error === 'SCHEDULE_EXISTS' || result.error === 'BATCH_SCHEDULE_EXISTS') {
        // 显示重复确认对话框
        const confirmUpdate = window.confirm(
          `${result.message}\n\n点击"确定"修改现有安排，点击"取消"保持不变。`
        )

        if (confirmUpdate) {
          // 用户确认修改，重新发送请求并添加 force_update 参数
          const forceUpdateBody = { ...requestBody, force_update: true }

          const forceResponse = await fetch('/api/admin/checkin-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(forceUpdateBody)
          })

          const forceResult = await forceResponse.json()

          if (forceResult.success) {
            setScheduleMessage(`✅ ${forceResult.message}`)
            // 清空表单
            setScheduleStudentId('')
            setScheduleBatchStart('')
            setScheduleBatchEnd('')
            setScheduleStartDate('')
            // 3秒后关闭模态框
            setTimeout(() => {
              setShowCheckinScheduleModal(false)
              setScheduleMessage('')
            }, 3000)
          } else {
            setScheduleMessage(`❌ 修改失败：${forceResult.error}`)
          }
        } else {
          setScheduleMessage('❌ 操作已取消')
        }
      } else {
        // 根据错误类型显示不同的错误信息
        let errorMessage = '❌ 设置失败'

        if (result.error === 'Database connection failed') {
          errorMessage = '❌ 数据库连接失败'
          if (result.message) {
            errorMessage += `：${result.message}`
          }
        } else if (result.error === 'Database configuration error') {
          errorMessage = '❌ 数据库配置错误：请联系管理员检查环境变量设置'
        } else if (result.error === 'STUDENT_NOT_FOUND') {
          errorMessage = `❌ ${result.message || '学号不存在'}`
        } else if (result.error === 'STUDENTS_NOT_FOUND') {
          errorMessage = `❌ ${result.message || '部分学号不存在'}`
          if (result.missingStudentIds) {
            errorMessage += `\n不存在的学号：${result.missingStudentIds.join(', ')}`
          }
        } else {
          errorMessage = `❌ 设置失败：${result.message || result.error || '未知错误'}`
        }

        setScheduleMessage(errorMessage)
      }
    } catch (error) {
      console.error('设置打卡日期失败:', error)
      setScheduleMessage('❌ 网络错误，请检查网络连接后重试')
    } finally {
      setScheduleLoading(false)
    }
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

        {/* 条件渲染：统计面板、学员管理、打卡管理或自主设定权限管理 */}
        {!showStudentManagement && !showCheckinManagement && !showSelfScheduleManagement ? (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                      <p className="text-white/60 text-sm">正在打卡</p>
                      <p className="text-2xl font-bold text-white">{stats.activePunches}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCheckinType('active')
                    setShowCheckinManagement(true)
                    loadCheckinData('active')
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
                      <p className="text-white/60 text-sm">打卡合格</p>
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
                      <p className="text-white/60 text-sm">打卡不合格</p>
                      <p className="text-2xl font-bold text-white">{stats.forgotStudents}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCheckinType('unqualified')
                    setShowCheckinManagement(true)
                    loadCheckinData('unqualified')
                  }}
                  className="w-full px-4 py-2 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 hover:text-orange-200 rounded-lg transition-all duration-300 text-sm"
                >
                  进入管理
                </button>
              </div>

              {/* 自主设定权限管理卡片 */}
              <div className="glass-effect p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">⚙️</div>
                    <div>
                      <p className="text-white/60 text-sm">自主设定权限</p>
                      <p className="text-2xl font-bold text-white">管理</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSelfScheduleManagement(true)
                    loadSelfScheduleData()
                  }}
                  className="w-full px-4 py-2 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 hover:text-purple-200 rounded-lg transition-all duration-300 text-sm"
                >
                  进入管理
                </button>
              </div>
            </div>

            {/* 测试数据清理工具 */}
            <div className="glass-effect p-6 rounded-xl mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">🧹</div>
                  <div>
                    <p className="text-white/60 text-sm">测试数据清理</p>
                    <p className="text-2xl font-bold text-white">工具</p>
                  </div>
                </div>
                <div className="flex-1 ml-4">
                  <Link
                    href="/admin/simple-test-data-cleanup"
                    className="block w-full px-4 py-2 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 hover:text-orange-200 rounded-lg transition-all duration-300 text-sm text-center"
                  >
                    🧹 清理测试数据
                  </Link>
                </div>
              </div>
            </div>
          </>) : showStudentManagement ? (
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
                  <button
                    onClick={() => setShowCheckinScheduleModal(true)}
                    className="px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 rounded-lg transition-all duration-300 text-sm font-medium"
                  >
                    📅 设置打卡日期
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
                ) : displayedStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-white/60">暂无学员数据</div>
                  </div>
                ) : (
                  displayedStudents.map((student) => (
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
                📊 {checkinType === 'active' ? '正在打卡' :
                     checkinType === 'qualified' ? '打卡合格' :
                     checkinType === 'unqualified' ? '打卡不合格' : '学员管理'}
              </h2>
            </div>

            {!showStudentDetail ? (
              <div className="glass-effect p-6 rounded-xl">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    {checkinType === 'active' ? '✅ 正在打卡的学员列表' :
                     checkinType === 'qualified' ? '⏳ 打卡合格的学员列表' :
                     checkinType === 'unqualified' ? '😴 打卡不合格的学员列表' : '学员列表'}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {checkinType === 'active' ? '这些学员正在打卡中' :
                     checkinType === 'qualified' ? '这些学员已完成打卡要求（93天内完成90次打卡）' :
                     checkinType === 'unqualified' ? '这些学员未完成打卡要求(93天内完成90次打卡)' : '学员管理'}
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
                            {student.schedule && (
                              <p className="text-white/50 text-xs">
                                打卡周期：{student.schedule.start_date} 至 {student.schedule.end_date}
                              </p>
                            )}
                            <p className="text-white/50 text-xs">
                              打卡进度：{student.checkinDays}/{student.totalDays} 天
                              ({student.completionRate}%)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            student.status === 'active' ? 'bg-blue-500/20 text-blue-300' :
                            student.status === 'qualified' ? 'bg-green-500/20 text-green-300' :
                            student.status === 'unqualified' ? 'bg-red-500/20 text-red-300' :
                            student.status === 'not_started' ? 'bg-gray-500/20 text-gray-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {student.status === 'active' ? '🔄 正在打卡' :
                             student.status === 'qualified' ? '✅ 打卡合格' :
                             student.status === 'unqualified' ? '❌ 打卡不合格' :
                             student.status === 'not_started' ? '⏳ 未开始' :
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

                  {(() => {
                    if (!selectedStudent?.schedule) return <div className="text-white/60 text-center py-4">暂无打卡安排</div>

                    const startDate = new Date(selectedStudent.schedule.start_date)
                    const endDate = new Date(selectedStudent.schedule.end_date)
                    const checkinDates = new Set(selectedStudent.records?.map((r: any) => r.checkin_date) || [])

                    // 生成所有涉及的月份
                    const months = []
                    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
                    const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

                    while (current <= lastMonth) {
                      months.push(new Date(current))
                      current.setMonth(current.getMonth() + 1)
                    }

                    return months.map((monthDate, monthIndex) => {
                      const year = monthDate.getFullYear()
                      const month = monthDate.getMonth()
                      const monthName = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'][month]

                      // 生成当月日历
                      const firstDay = new Date(year, month, 1)
                      const lastDay = new Date(year, month + 1, 0)
                      const calendarDays = []

                      // 填充月初空白
                      const startWeekday = firstDay.getDay()
                      for (let i = 0; i < startWeekday; i++) {
                        calendarDays.push(<div key={`empty-${monthIndex}-${i}`} className="p-2"></div>)
                      }

                      // 填充日期
                      const currentDay = new Date(firstDay)
                      while (currentDay <= lastDay) {
                        const dateStr = getBeijingDateString(currentDay)
                        const hasCheckin = checkinDates.has(dateStr)

                        // 检查是否在打卡周期内
                        const isInSchedule = dateStr >= selectedStudent.schedule.start_date && dateStr <= selectedStudent.schedule.end_date
                        const today = getBeijingDateString()
                        const isPast = dateStr < today

                        // 复制学员端的逻辑，保持完全一致
                        let statusClass = 'glass-effect border-white/20'
                        let textClass = 'text-white'

                        if (!isInSchedule) {
                          // 不在打卡周期内 - 普通显示
                          statusClass = 'bg-gray-500/10 border-gray-500/30'
                          textClass = 'text-white/50'
                        } else if (hasCheckin) {
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

                        // 强制修复：对于有打卡的日期使用内联样式
                        const finalStyle = hasCheckin ? {
                          backgroundColor: 'rgba(34, 197, 94, 0.3)',
                          borderColor: 'rgb(34, 197, 94)',
                          color: 'white'
                        } : {}

                        calendarDays.push(
                          <div
                            key={`${dateStr}-${hasCheckin ? 'checked' : 'unchecked'}`}
                            className={`p-2 rounded text-xs ${statusClass} ${textClass} relative`}
                            style={finalStyle}
                          >
                            {currentDay.getDate()}
                            {hasCheckin && <div className="absolute top-0 right-0 text-xs">✅</div>}
                          </div>
                        )

                        currentDay.setDate(currentDay.getDate() + 1)
                      }

                      return (
                        <div key={`${year}-${month}`} className="mb-6">
                          {/* 月份标题 */}
                          <div className="text-center mb-3">
                            <h5 className="text-lg font-bold text-white">{year}年 {monthName}</h5>
                          </div>

                          {/* 日历网格 */}
                          <div className="grid grid-cols-7 gap-1 text-center text-xs">
                            {/* 星期标题 */}
                            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                              <div key={day} className="p-2 text-white/60 font-medium">{day}</div>
                            ))}
                            {calendarDays}
                          </div>
                        </div>
                      )
                    })
                  })()}

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
                          {(record.xhs_url || record.xiaohongshu_link || record.xiaohongshu_url) && (
                            <a
                              href={record.xhs_url || record.xiaohongshu_link || record.xiaohongshu_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm break-all"
                            >
                              🔗 {record.xhs_url || record.xiaohongshu_link || record.xiaohongshu_url}
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

        {/* 设置打卡日期模态框 */}
        {showCheckinScheduleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-6 rounded-xl border border-white/20 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">📅 设置打卡日期</h3>
                <button
                  onClick={() => {
                    setShowCheckinScheduleModal(false)
                    setScheduleMessage('')
                  }}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 模式选择 */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">设置模式</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="single"
                        checked={scheduleMode === 'single'}
                        onChange={(e) => setScheduleMode(e.target.value as 'single' | 'batch')}
                        className="mr-2"
                      />
                      <span className="text-white/80">单个学员</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="batch"
                        checked={scheduleMode === 'batch'}
                        onChange={(e) => setScheduleMode(e.target.value as 'single' | 'batch')}
                        className="mr-2"
                      />
                      <span className="text-white/80">批量设置</span>
                    </label>
                  </div>
                </div>

                {/* 单个学员设置 */}
                {scheduleMode === 'single' && (
                  <div className="relative">
                    <label className="block text-white/80 text-sm font-medium mb-2">学员学号</label>
                    <input
                      type="text"
                      value={scheduleStudentId}
                      onChange={(e) => handleStudentIdInput(e.target.value)}
                      onFocus={() => {
                        if (scheduleStudentId.trim()) {
                          handleStudentIdInput(scheduleStudentId)
                        }
                      }}
                      onBlur={() => {
                        // 延迟关闭下拉框，允许点击选择
                        setTimeout(() => setShowStudentDropdown(false), 200)
                      }}
                      placeholder="请输入学员学号或姓名"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    />

                    {/* 下拉选择列表 */}
                    {showStudentDropdown && filteredStudents.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            onClick={() => handleSelectStudent(student)}
                            className="px-3 py-2 hover:bg-white/10 cursor-pointer border-b border-white/10 last:border-b-0"
                          >
                            <div className="text-white text-sm font-medium">{student.student_id}</div>
                            <div className="text-white/70 text-xs">{student.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 批量设置 */}
                {scheduleMode === 'batch' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">起始学号</label>
                      <input
                        type="text"
                        value={scheduleBatchStart}
                        onChange={(e) => setScheduleBatchStart(e.target.value)}
                        placeholder="例如：AXCF2025010001"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">结束学号</label>
                      <input
                        type="text"
                        value={scheduleBatchEnd}
                        onChange={(e) => setScheduleBatchEnd(e.target.value)}
                        placeholder="例如：AXCF2025010020"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                )}

                {/* 开始日期 */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">开始日期</label>
                  <input
                    type="date"
                    value={scheduleStartDate}
                    onChange={(e) => setScheduleStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* 消息显示 */}
                {scheduleMessage && (
                  <div className="p-3 bg-white/10 rounded-lg">
                    <p className="text-white/80 text-sm">{scheduleMessage}</p>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCheckinScheduleModal(false)
                      setScheduleMessage('')
                    }}
                    className="flex-1 px-4 py-2 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white rounded-lg transition-all duration-300"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSetCheckinSchedule}
                    disabled={scheduleLoading}
                    className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {scheduleLoading ? '设置中...' : '确认设置'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 自主设定权限管理界面 */}
        {showSelfScheduleManagement && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setShowSelfScheduleManagement(false)}
                className="mr-4 p-2 text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white">⚙️ 自主设定权限管理</h2>
                <p className="text-white/60">管理学员自主设定打卡时间的权限</p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setShowSelfScheduleModal(true)}
                className="px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 rounded-lg transition-all duration-300"
              >
                ➕ 设置权限
              </button>
            </div>

            {/* 学员权限列表 */}
            <div className="glass-effect p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">学员权限状态</h3>

              {selfScheduleLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="text-white/60 mt-2">加载中...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selfScheduleStudents.filter(student => student.can_self_schedule).map((student) => (
                    <div key={student.student_id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{student.name}</p>
                        <p className="text-white/60 text-sm">{student.student_id}</p>
                        <p className="text-white/50 text-xs">
                          截止时间: {new Date(student.self_schedule_deadline).toLocaleDateString()}
                        </p>
                        <p className="text-white/50 text-xs">
                          状态: {student.has_used_self_schedule ? '已设置' : '未设置'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                          有权限
                        </span>
                        <button
                          onClick={() => handleRemoveSelfSchedulePermission([student.student_id])}
                          className="px-3 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 rounded text-xs transition-all duration-300"
                        >
                          移除权限
                        </button>
                      </div>
                    </div>
                  ))}

                  {selfScheduleStudents.filter(student => student.can_self_schedule).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-white/60">暂无学员拥有自主设定权限</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 自主设定权限设置模态框 */}
        {showSelfScheduleModal && (
          <SelfSchedulePermissionModal
            onClose={() => setShowSelfScheduleModal(false)}
            onSuccess={() => {
              setShowSelfScheduleModal(false)
              loadSelfScheduleData()
            }}
            allStudents={allStudents}
            adminStudentId={user?.student_id || ''}
          />
        )}

        {/* 编辑学员模态框 */}
        {showEditStudentModal && editingStudent && (
          <EditStudentModal
            student={editingStudent}
            onClose={() => {
              setShowEditStudentModal(false)
              setEditingStudent(null)
            }}
            onUpdate={handleUpdateStudent}
          />
        )}
      </div>
    </div>
  )
}

// 编辑学员模态框组件
function EditStudentModal({
  student,
  onClose,
  onUpdate
}: {
  student: Student
  onClose: () => void
  onUpdate: (studentId: string, name: string) => Promise<boolean>
}) {
  const [name, setName] = useState(student.name)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setMessage('请输入学员姓名')
      return
    }

    setLoading(true)
    setMessage('')

    const success = await onUpdate(student.student_id, name.trim())

    if (success) {
      setMessage('✅ 更新成功！')
      setTimeout(() => {
        onClose()
      }, 1500)
    } else {
      setMessage('❌ 更新失败，请重试')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-effect p-6 rounded-xl border border-white/20 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">✏️ 编辑学员信息</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">学号</label>
            <input
              type="text"
              value={student.student_id}
              disabled
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white/60 cursor-not-allowed"
            />
            <p className="text-white/50 text-xs mt-1">学号不可修改</p>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">姓名 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入学员姓名"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
              disabled={loading}
            />
          </div>

          {message && (
            <div className="p-3 bg-white/10 rounded-lg">
              <p className="text-white/80 text-sm">{message}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '更新中...' : '确认更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 自主设定权限设置模态框组件
function SelfSchedulePermissionModal({
  onClose,
  onSuccess,
  allStudents,
  adminStudentId
}: {
  onClose: () => void
  onSuccess: () => void
  allStudents: Student[]
  adminStudentId: string
}) {
  const [mode, setMode] = useState<'individual' | 'range'>('individual')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [rangeStartId, setRangeStartId] = useState('')
  const [rangeEndId, setRangeEndId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'individual' && selectedStudentIds.length === 0) {
      setMessage('请选择至少一个学员')
      return
    }

    if (mode === 'range' && (!rangeStartId.trim() || !rangeEndId.trim())) {
      setMessage('请输入学号范围')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const requestData = {
        action: mode === 'individual' ? 'set_individual' : 'set_range',
        student_ids: mode === 'individual' ? selectedStudentIds : undefined,
        start_student_id: mode === 'range' ? rangeStartId.trim() : undefined,
        end_student_id: mode === 'range' ? rangeEndId.trim() : undefined
      }

      console.log('发送权限设置请求:', requestData)

      const response = await fetch('/api/admin/self-schedule-permission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminStudentId}`
        },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      console.log('权限设置响应:', { status: response.status, data })

      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setMessage(`❌ ${data.error || '设置失败'}`)
      }
    } catch (error) {
      console.error('设置自主权限失败:', error)
      setMessage('❌ 网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  // 过滤学员列表
  const filteredStudents = allStudents
    .filter(s => s.role === 'student')
    .filter(student => {
      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase()
      return (
        student.student_id.toLowerCase().includes(term) ||
        student.name.toLowerCase().includes(term)
      )
    })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/90 backdrop-blur-sm border border-white/20 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">设置自主设定权限</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 设置模式选择 */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">设置模式</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="individual"
                  checked={mode === 'individual'}
                  onChange={(e) => setMode(e.target.value as 'individual' | 'range')}
                  className="mr-2"
                />
                <span className="text-white/80">逐个设置</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="range"
                  checked={mode === 'range'}
                  onChange={(e) => setMode(e.target.value as 'individual' | 'range')}
                  className="mr-2"
                />
                <span className="text-white/80">批量范围设置</span>
              </label>
            </div>
          </div>

          {/* 逐个设置 */}
          {mode === 'individual' && (
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                选择学员 (已选择 {selectedStudentIds.length} 个)
              </label>

              {/* 搜索框 */}
              <div className="mb-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索学号或昵称..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-white/20 rounded-lg p-3 space-y-2">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <label key={student.student_id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.student_id)}
                        onChange={() => toggleStudentSelection(student.student_id)}
                        className="mr-2"
                      />
                      <span className="text-white/80 text-sm">
                        {student.student_id} - {student.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="text-white/50 text-sm text-center py-4">
                    {searchTerm ? '没有找到匹配的学员' : '没有学员数据'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 批量范围设置 */}
          {mode === 'range' && (
            <div className="space-y-3">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">起始学号</label>
                <input
                  type="text"
                  value={rangeStartId}
                  onChange={(e) => setRangeStartId(e.target.value)}
                  placeholder="例如：AXCF2025050001"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">结束学号</label>
                <input
                  type="text"
                  value={rangeEndId}
                  onChange={(e) => setRangeEndId(e.target.value)}
                  placeholder="例如：AXCF2025050100"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm">
                  💡 批量设置会为范围内的现有学员开启权限，同时为未来新增的学号自动分配权限
                </p>
              </div>
            </div>
          )}

          {/* 消息显示 */}
          {message && (
            <div className="p-3 bg-white/10 rounded-lg">
              <p className="text-white/80 text-sm">{message}</p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '设置中...' : '确认设置'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
