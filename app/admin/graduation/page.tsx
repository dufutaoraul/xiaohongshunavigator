'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'

interface GraduationCandidate {
  id: string
  student_id: string
  name: string
  total_punches: number
  consecutive_days: number
  last_punch_date: string
  graduation_status: 'pending' | 'approved' | 'rejected'
  applied_at: string
}

export default function GraduationReview() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [candidates, setCandidates] = useState<GraduationCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

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

  // 加载毕业候选人数据
  useEffect(() => {
    if (isAdmin) {
      loadGraduationCandidates()
    }
  }, [isAdmin])

  const loadGraduationCandidates = async () => {
    try {
      setLoading(true)
      
      // 这里模拟数据，实际应该从API获取
      const mockData: GraduationCandidate[] = [
        {
          id: '1',
          student_id: 'AXCF2025040001',
          name: '张三',
          total_punches: 92,
          consecutive_days: 90,
          last_punch_date: '2025-01-19',
          graduation_status: 'pending',
          applied_at: '2025-01-20'
        },
        {
          id: '2',
          student_id: 'AXCF2025040002',
          name: '李四',
          total_punches: 95,
          consecutive_days: 90,
          last_punch_date: '2025-01-19',
          graduation_status: 'pending',
          applied_at: '2025-01-19'
        }
      ]
      
      setCandidates(mockData)
      
    } catch (error) {
      console.error('Failed to load graduation candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGraduationDecision = async (candidateId: string, decision: 'approved' | 'rejected') => {
    try {
      setProcessingId(candidateId)
      
      // 这里应该调用API处理毕业审核
      // const response = await fetch('/api/admin/graduation', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ candidateId, decision })
      // })
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 更新本地状态
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === candidateId 
            ? { ...candidate, graduation_status: decision }
            : candidate
        )
      )
      
    } catch (error) {
      console.error('Failed to process graduation decision:', error)
    } finally {
      setProcessingId(null)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            🎓 毕业审核
          </h1>
          <p className="text-white/70">
            审核完成90天打卡挑战的学员毕业申请
          </p>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center">
              <div className="text-3xl mr-4">⏳</div>
              <div>
                <p className="text-white/60 text-sm">待审核</p>
                <p className="text-2xl font-bold text-white">
                  {candidates.filter(c => c.graduation_status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center">
              <div className="text-3xl mr-4">✅</div>
              <div>
                <p className="text-white/60 text-sm">已通过</p>
                <p className="text-2xl font-bold text-green-400">
                  {candidates.filter(c => c.graduation_status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center">
              <div className="text-3xl mr-4">❌</div>
              <div>
                <p className="text-white/60 text-sm">已驳回</p>
                <p className="text-2xl font-bold text-red-400">
                  {candidates.filter(c => c.graduation_status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 候选人列表 */}
        <div className="glass-effect p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-6">毕业候选人列表</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="text-white/60">加载中...</div>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎓</div>
              <div className="text-white/60">暂无毕业申请</div>
            </div>
          ) : (
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="bg-white/5 rounded-lg border border-white/10 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="text-4xl">
                        {candidate.graduation_status === 'approved' ? '🎉' : 
                         candidate.graduation_status === 'rejected' ? '😔' : '🎓'}
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-white">{candidate.name}</h3>
                        <p className="text-white/60">{candidate.student_id}</p>
                        <p className="text-white/50 text-sm">申请时间: {candidate.applied_at}</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-400">{candidate.total_punches}</p>
                          <p className="text-white/60 text-sm">总打卡数</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-400">{candidate.consecutive_days}</p>
                          <p className="text-white/60 text-sm">连续天数</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{candidate.last_punch_date}</p>
                          <p className="text-white/60 text-sm">最后打卡</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {candidate.graduation_status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleGraduationDecision(candidate.id, 'approved')}
                            disabled={processingId === candidate.id}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-300 disabled:opacity-50"
                          >
                            {processingId === candidate.id ? '处理中...' : '✅ 通过'}
                          </button>
                          <button
                            onClick={() => handleGraduationDecision(candidate.id, 'rejected')}
                            disabled={processingId === candidate.id}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-300 disabled:opacity-50"
                          >
                            {processingId === candidate.id ? '处理中...' : '❌ 驳回'}
                          </button>
                        </>
                      ) : (
                        <span className={`px-4 py-2 rounded-lg font-medium ${
                          candidate.graduation_status === 'approved' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {candidate.graduation_status === 'approved' ? '已通过' : '已驳回'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* 进度条 */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-white/60 mb-2">
                      <span>打卡进度</span>
                      <span>{candidate.consecutive_days}/90 天</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((candidate.consecutive_days / 90) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}