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
  totalAdmins: number
  activePunches: number
  pendingHomework: number
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalAdmins: 0,
    activePunches: 0,
    pendingHomework: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

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
        const totalAdmins = studentsData.students?.filter((s: Student) => s.role === 'admin').length || 0
        
        setStats(prev => ({
          ...prev,
          totalStudents,
          totalAdmins
        }))
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 过滤学员
  const filteredStudents = students.filter(student =>
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <p className="text-white/60 text-sm">总学员数</p>
                <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👑</div>
              <div>
                <p className="text-white/60 text-sm">管理员数</p>
                <p className="text-2xl font-bold text-white">{stats.totalAdmins}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <p className="text-white/60 text-sm">活跃打卡</p>
                <p className="text-2xl font-bold text-white">{stats.activePunches}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📝</div>
              <div>
                <p className="text-white/60 text-sm">待批改作业</p>
                <p className="text-2xl font-bold text-white">{stats.pendingHomework}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 功能区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 学员管理 */}
          <div className="lg:col-span-2">
            <div className="glass-effect p-6 rounded-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">👥 学员管理</h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="cosmic-button px-4 py-2 rounded-lg text-sm font-medium"
                >
                  ➕ 新增学员
                </button>
              </div>

              {/* 搜索框 */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="搜索学员（学号或姓名）..."
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
                        <button className="text-white/60 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10">
                          编辑
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="space-y-6">
            {/* 作业与审核 */}
            <div className="glass-effect p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">📋 作业与审核</h3>
              <div className="space-y-3">
                <Link
                  href="/homework"
                  className="block w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📝</span>
                    <div>
                      <p className="text-white font-medium">待批改作业</p>
                      <p className="text-white/60 text-sm">查看和批改学员作业</p>
                    </div>
                  </div>
                </Link>
                
                <Link
                  href="/admin/graduation"
                  className="block w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🎓</span>
                    <div>
                      <p className="text-white font-medium">毕业审核</p>
                      <p className="text-white/60 text-sm">审核学员毕业申请</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* 系统工具 */}
            <div className="glass-effect p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">🔧 系统工具</h3>
              <div className="space-y-3">
                <button className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300 text-left">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📊</span>
                    <div>
                      <p className="text-white font-medium">数据导出</p>
                      <p className="text-white/60 text-sm">导出学员和打卡数据</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300 text-left">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🔄</span>
                    <div>
                      <p className="text-white font-medium">系统同步</p>
                      <p className="text-white/60 text-sm">同步外部数据源</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 新增学员模态框 */}
      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  )
}