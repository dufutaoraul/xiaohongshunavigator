'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import Link from 'next/link'
import AddStudentModal from '../components/AddStudentModal'

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
  unqualifiedStudents: number
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    activePunches: 0,
    qualifiedStudents: 0,
    unqualifiedStudents: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'student_id' | 'name' | 'real_name'>('student_id')
  const [showStudentManagement, setShowStudentManagement] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [checkinMode, setCheckinMode] = useState<'single' | 'batch'>('single')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [checkinStartDate, setCheckinStartDate] = useState('')
  const [batchStartId, setBatchStartId] = useState('')
  const [batchEndId, setBatchEndId] = useState('')

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
          unqualifiedStudents: checkinStatsData.unqualifiedStudents || 0
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

  // 编辑学员
  const handleEditStudent = (student: Student) => {
    // 跳转到学员资料设置界面
    const editUrl = `/profile?edit=true&student_id=${student.student_id}&name=${encodeURIComponent(student.name)}&real_name=${encodeURIComponent((student as any).real_name || '')}`
    window.open(editUrl, '_blank')
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            ⚙️ 管理员后台
          </h1>
          <p className="text-white/70">
            欢迎回来，{user?.name}！管理学员信息和系统运营数据。
          </p>

          {/* 数据库清理按钮 */}
          <div className="mt-4 text-center">
            <button
              onClick={async () => {
                if (confirm('确定要清理无用的数据库表格吗？此操作不可逆！')) {
                  try {
                    const response = await fetch('/api/admin/cleanup-database', {
                      method: 'POST'
                    })
                    const result = await response.json()
                    if (result.success) {
                      alert(`数据库清理完成！${result.message}`)
                    } else {
                      alert(`清理失败：${result.error}`)
                    }
                  } catch (error) {
                    alert('清理过程中发生错误')
                  }
                }
              }}
              className="px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 rounded-lg transition-all duration-300 text-sm"
            >
              🧹 清理无用数据库表格
            </button>
          </div>
        </div>

        {/* 条件渲染：统计面板或学员管理 */}
        {!showStudentManagement ? (
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
                <div className="text-3xl mr-4">📊</div>
                <div>
                  <p className="text-white/60 text-sm">正在打卡人数</p>
                  <p className="text-2xl font-bold text-white">{stats.activePunches}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                // TODO: 跳转到正在打卡学员列表页面
                alert('正在打卡学员列表功能开发中...')
              }}
              className="w-full px-4 py-2 bg-green-500/20 text-green-300 hover:bg-green-500/30 hover:text-green-200 rounded-lg transition-all duration-300 text-sm"
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
                // TODO: 跳转到打卡合格学员列表页面
                alert('打卡合格学员列表功能开发中...')
              }}
              className="w-full px-4 py-2 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200 rounded-lg transition-all duration-300 text-sm"
            >
              进入管理
            </button>
          </div>

          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="text-3xl mr-4">❌</div>
                <div>
                  <p className="text-white/60 text-sm">打卡不合格人数</p>
                  <p className="text-2xl font-bold text-white">{stats.unqualifiedStudents}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                // TODO: 跳转到打卡不合格学员列表页面
                alert('打卡不合格学员列表功能开发中...')
              }}
              className="w-full px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 rounded-lg transition-all duration-300 text-sm"
            >
              进入管理
            </button>
          </div>
            </div>
          </>
        ) : (
          /* 学员管理界面 */
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
          {/* 学员管理 */}
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
                    onClick={() => setShowCheckinModal(true)}
                    className="cosmic-button px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    ⏰ 设置打卡时间
                  </button>
                </div>
              </div>

              {/* 搜索区域 */}
              <div className="mb-4 space-y-3">
                {/* 搜索类型选择 */}
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

                {/* 搜索框 */}
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
        </div>

        {/* 打卡时间设置模态框 */}
        {showCheckinModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowStudentDropdown(false)
            }
          }}
        >
          <div className="glass-effect p-6 rounded-lg border border-white/20 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">⏰ 设置打卡开始时间</h3>

            {/* 模式选择 */}
            <div className="mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCheckinMode('single')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    checkinMode === 'single'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  单个设置
                </button>
                <button
                  onClick={() => setCheckinMode('batch')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    checkinMode === 'batch'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  批量设置
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {checkinMode === 'single' ? (
                <div className="relative">
                  <label className="block text-sm font-medium text-white mb-2">
                    选择学员（输入学号或姓名搜索）
                  </label>
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => {
                      setStudentSearchTerm(e.target.value)
                      setShowStudentDropdown(true)
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    placeholder="输入学号或姓名搜索学员..."
                    className="w-full px-3 py-2 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none"
                  />

                  {/* 搜索结果下拉框 */}
                  {showStudentDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-black/90 border border-white/30 rounded-lg max-h-60 overflow-y-auto">
                      {students
                        .filter(student =>
                          student.student_id.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                          student.name.toLowerCase().includes(studentSearchTerm.toLowerCase())
                        )
                        .slice(0, 10) // 最多显示10个结果
                        .map(student => (
                          <div
                            key={student.student_id}
                            onClick={() => {
                              setSelectedStudent(student)
                              setStudentSearchTerm(`${student.student_id} - ${student.name}`)
                              setShowStudentDropdown(false)
                            }}
                            className="px-3 py-2 hover:bg-white/10 cursor-pointer text-white border-b border-white/10 last:border-b-0"
                          >
                            <div className="font-medium">{student.student_id}</div>
                            <div className="text-sm text-white/70">{student.name}</div>
                          </div>
                        ))
                      }
                      {students.filter(student =>
                        student.student_id.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        student.name.toLowerCase().includes(studentSearchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-white/50">没有找到匹配的学员</div>
                      )}
                    </div>
                  )}

                  {selectedStudent && (
                    <div className="mt-2 text-sm text-green-400">
                      已选择：{selectedStudent.student_id} - {selectedStudent.name}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      起始学号
                    </label>
                    <input
                      type="text"
                      value={batchStartId}
                      onChange={(e) => setBatchStartId(e.target.value)}
                      placeholder="例如：AXCF2025010001"
                      className="w-full px-3 py-2 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      结束学号
                    </label>
                    <input
                      type="text"
                      value={batchEndId}
                      onChange={(e) => setBatchEndId(e.target.value)}
                      placeholder="例如：AXCF2025010010"
                      className="w-full px-3 py-2 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  打卡开始日期
                </label>
                <input
                  type="date"
                  value={checkinStartDate}
                  onChange={(e) => setCheckinStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-black/20 border border-white/30 rounded-lg text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={async () => {
                    if (!checkinStartDate) {
                      alert('请选择打卡开始日期')
                      return
                    }

                    if (checkinMode === 'single' && !selectedStudent) {
                      alert('请选择学员')
                      return
                    }

                    if (checkinMode === 'batch' && (!batchStartId || !batchEndId)) {
                      alert('请输入起始和结束学号')
                      return
                    }

                    try {
                      const response = await fetch('/api/admin/checkin-schedule', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          mode: checkinMode,
                          student_id: selectedStudent?.student_id,
                          batch_start_id: batchStartId,
                          batch_end_id: batchEndId,
                          start_date: checkinStartDate,
                          created_by: user?.student_id || 'ADMIN'
                        })
                      })

                      const result = await response.json()

                      if (result.success) {
                        alert(result.message)
                        setShowCheckinModal(false)
                        // 清空表单
                        setSelectedStudent(null)
                        setBatchStartId('')
                        setBatchEndId('')
                        setCheckinStartDate('')
                      } else {
                        alert('设置失败：' + result.error)
                      }
                    } catch (error) {
                      console.error('Error setting checkin schedule:', error)
                      alert('设置失败，请重试')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  确认设置
                </button>
                <button
                  onClick={() => setShowCheckinModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
          </div>
        )}
      )}

      {/* 新增学员模态框 */}
      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  )
}