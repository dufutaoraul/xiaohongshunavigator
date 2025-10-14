'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import Link from 'next/link'
import GlobalUserMenu from '../../components/GlobalUserMenu'

interface AnalyzedRecord {
  id: string
  checkin_date: string
  created_at: string
  xhs_url?: string
  xiaohongshu_url?: string
  xiaohongshu_link?: string
  analysis: {
    isTestData: boolean
    testReasons: string[]
    timeDifference: {
      days: number
      hours: number
    }
    createdTime: {
      hour: number
      minute: number
      isWorkTime: boolean
    }
  }
}

interface AnalysisResult {
  统计信息: {
    总记录数: number
    测试记录数: number
    真实记录数: number
    测试数据占比: number
    学员信息: {
      student_id: string
      hasSchedule: boolean
      schedule?: {
        start_date: string
        end_date: string
      }
    }
  }
  测试原因统计: Record<string, number>
  详细记录: AnalyzedRecord[]
  测试记录ID: string[]
  真实记录ID: string[]
}

export default function TestDataCleanupPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

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

  const analyzeData = async () => {
    if (!studentId.trim()) {
      setMessage('请输入学员学号')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`/api/admin/analyze-test-data?student_id=${studentId.trim()}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setAnalysisResult(data.analysis)
        setMessage(`✅ 分析完成！发现 ${data.analysis.统计信息.测试记录数} 条测试数据`)
      } else {
        setMessage(`❌ 分析失败：${data.error || '未知错误'}`)
        setAnalysisResult(null)
      }
    } catch (error) {
      console.error('分析数据失败:', error)
      setMessage('❌ 网络错误，请重试')
      setAnalysisResult(null)
    } finally {
      setLoading(false)
    }
  }

  const deleteTestData = async () => {
    if (!analysisResult || !studentId.trim()) {
      setMessage('没有可删除的测试数据')
      return
    }

    if (analysisResult.统计信息.测试记录数 === 0) {
      setMessage('没有找到测试数据，无需删除')
      return
    }

    setDeleting(true)
    setMessage('')

    try {
      const response = await fetch(`/api/admin/analyze-test-data?student_id=${studentId.trim()}&confirm=true`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (response.ok && data.success) {
        setMessage(`✅ 清理成功！已删除 ${data.deletedCount} 条测试数据`)
        setShowConfirmDialog(false)

        // 重新分析数据
        setTimeout(() => {
          analyzeData()
        }, 1000)
      } else {
        setMessage(`❌ 删除失败：${data.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('删除测试数据失败:', error)
      setMessage('❌ 网络错误，请重试')
    } finally {
      setDeleting(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* 全局用户菜单 */}
      <GlobalUserMenu className="absolute top-6 left-6 z-50" />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/admin"
              className="mr-4 p-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-4xl font-bold gradient-text">
              🧹 测试数据清理工具
            </h1>
          </div>
          <p className="text-white/70">
            分析并清理学员的测试打卡数据，恢复真实的打卡记录显示
          </p>
        </div>

        {/* 输入区域 */}
        <div className="glass-effect p-6 rounded-xl mb-8">
          <div className="flex space-x-4">
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="请输入学员学号（如：AXCF2025040095）"
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
            />
            <button
              onClick={analyzeData}
              disabled={loading}
              className="px-6 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '分析中...' : '🔍 分析数据'}
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('成功') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* 分析结果 */}
        {analysisResult && (
          <div className="space-y-8">
            {/* 统计概览 */}
            <div className="glass-effect p-6 rounded-xl">
              <h2 className="text-2xl font-bold text-white mb-6">📊 分析结果概览</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{analysisResult.统计信息.总记录数}</div>
                  <div className="text-white/60">总记录数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400">{analysisResult.统计信息.测试记录数}</div>
                  <div className="text-white/60">测试数据</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{analysisResult.统计信息.真实记录数}</div>
                  <div className="text-white/60">真实数据</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400">{analysisResult.统计信息.测试数据占比}%</div>
                  <div className="text-white/60">测试数据占比</div>
                </div>
              </div>

              {/* 学员信息 */}
              <div className="p-4 bg-white/5 rounded-lg mb-4">
                <h3 className="text-lg font-medium text-white mb-2">👤 学员信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">学号：</span>
                    <span className="text-white">{analysisResult.统计信息.学员信息.student_id}</span>
                  </div>
                  {analysisResult.统计信息.学员信息.hasSchedule && (
                    <>
                      <div>
                        <span className="text-white/60">打卡周期：</span>
                        <span className="text-green-400">
                          {analysisResult.统计信息.学员信息.schedule?.start_date} 至 {analysisResult.统计信息.学员信息.schedule?.end_date}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              {analysisResult.统计信息.测试记录数 > 0 && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowConfirmDialog(true)}
                    className="px-6 py-3 bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 rounded-lg transition-all duration-300"
                  >
                    🗑️ 删除测试数据 ({analysisResult.统计信息.测试记录数} 条)
                  </button>
                </div>
              )}
            </div>

            {/* 测试原因统计 */}
            {Object.keys(analysisResult.测试原因统计).length > 0 && (
              <div className="glass-effect p-6 rounded-xl">
                <h2 className="text-2xl font-bold text-white mb-6">🔍 测试数据原因分析</h2>
                <div className="space-y-2">
                  {Object.entries(analysisResult.测试原因统计).map(([reason, count]) => (
                    <div key={reason} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-white/80">{reason}</span>
                      <span className="text-orange-400 font-medium">{count} 条</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 详细记录 */}
            <div className="glass-effect p-6 rounded-xl">
              <h2 className="text-2xl font-bold text-white mb-6">📋 详细记录列表</h2>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analysisResult.详细记录.map((record) => (
                  <div
                    key={record.id}
                    className={`p-4 rounded-lg border ${
                      record.analysis.isTestData
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-green-500/10 border-green-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-white font-medium">
                          {new Date(record.checkin_date).toLocaleDateString('zh-CN')}
                        </span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          record.analysis.isTestData
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-green-500/20 text-green-300'
                        }`}>
                          {record.analysis.isTestData ? '测试数据' : '真实数据'}
                        </span>
                      </div>
                      <div className="text-white/50 text-xs">
                        创建时间：{new Date(record.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>

                    {record.analysis.testReasons.length > 0 && (
                      <div className="text-sm text-red-300 mb-2">
                        原因：{record.analysis.testReasons.join(', ')}
                      </div>
                    )}

                    {(record.xhs_url || record.xiaohongshu_url || record.xiaohongshu_link) && (
                      <div className="text-xs text-blue-300 truncate">
                        链接：{record.xhs_url || record.xiaohongshu_url || record.xiaohongshu_link}
                      </div>
                    )}

                    <div className="text-xs text-white/50 mt-2">
                      时间差异：{record.analysis.timeDifference.days}天 {record.analysis.timeDifference.hours}小时
                      {record.analysis.createdTime.isWorkTime && ' | 工作时间创建'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 确认删除对话框 */}
        {showConfirmDialog && analysisResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-6 rounded-xl border border-white/20 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">⚠️ 确认删除测试数据</h3>

              <div className="mb-6">
                <p className="text-white/80 mb-4">
                  即将删除学员 <span className="text-blue-300 font-medium">{studentId}</span> 的测试数据：
                </p>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="text-red-300 text-sm">
                    <p>• 将删除 <span className="font-bold">{analysisResult.统计信息.测试记录数}</span> 条测试数据</p>
                    <p>• 保留 <span className="font-bold">{analysisResult.统计信息.真实记录数}</span> 条真实数据</p>
                    <p>• 此操作不可恢复</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white rounded-lg transition-all duration-300 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={deleteTestData}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 rounded-lg transition-all duration-300 disabled:opacity-50"
                >
                  {deleting ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}