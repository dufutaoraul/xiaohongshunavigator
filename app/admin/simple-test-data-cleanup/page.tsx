'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import Link from 'next/link'
import GlobalUserMenu from '../../components/GlobalUserMenu'

interface CheckinRecord {
  id: string
  checkin_date: string
  created_at: string
  xhs_url?: string
  xiaohongshu_url?: string
  xiaohongshu_link?: string
  student_name?: string
}

interface AnalysisResult {
  分界日期: string
  删除说明: string
  保留说明: string
  待删除记录: CheckinRecord[]
  保留记录: CheckinRecord[]
  统计: {
    待删除记录数: number
    保留记录数: number
    总记录数: number
  }
  删除记录ID: string[]
}

export default function SimpleTestDataCleanupPage() {
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
      const response = await fetch(`/api/admin/simple-test-data-cleanup?student_id=${studentId.trim()}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setAnalysisResult(data.analysis)

        if (data.analysis.统计.待删除记录数 > 0) {
          setMessage(`⚠️ 发现 ${data.analysis.统计.待删除记录数} 条测试数据（${data.analysis.分界日期} 之前）`)
        } else {
          setMessage(`✅ 没有发现测试数据，所有记录都是真实的`)
        }
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

    if (analysisResult.统计.待删除记录数 === 0) {
      setMessage('没有找到测试数据，无需删除')
      return
    }

    setDeleting(true)
    setMessage('')

    try {
      const response = await fetch(`/api/admin/simple-test-data-cleanup?student_id=${studentId.trim()}&confirm=true`, {
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
              🧹 简单测试数据清理
            </h1>
          </div>
          <p className="text-white/70">
            按9月25日分界线清理测试数据：删除之前的测试记录，保留之后的真实记录
          </p>
        </div>

        {/* 输入区域 */}
        <div className="glass-effect p-6 rounded-xl mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-white mb-2">清理规则</h3>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="text-sm text-blue-300">
                <p>📅 <strong>分界日期：2024年9月25日</strong></p>
                <p className="mt-1">🗑️ <strong>删除：</strong>2024年9月25日之前创建的所有记录（测试数据）</p>
                <p className="mt-1">💾 <strong>保留：</strong>2024年9月25日及之后创建的所有记录（真实数据）</p>
              </div>
            </div>
          </div>

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
              {loading ? '查询中...' : '🔍 查询数据'}
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
              <h2 className="text-2xl font-bold text-white mb-6">📊 查询结果</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400">{analysisResult.统计.待删除记录数}</div>
                  <div className="text-white/60">待删除记录</div>
                  <div className="text-xs text-red-300 mt-1">（测试数据）</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{analysisResult.统计.保留记录数}</div>
                  <div className="text-white/60">保留记录</div>
                  <div className="text-xs text-green-300 mt-1">（真实数据）</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{analysisResult.统计.总记录数}</div>
                  <div className="text-white/60">总记录数</div>
                </div>
              </div>

              {/* 操作按钮 */}
              {analysisResult.统计.待删除记录数 > 0 && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowConfirmDialog(true)}
                    className="px-6 py-3 bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 rounded-lg transition-all duration-300"
                  >
                    🗑️ 删除 {analysisResult.统计.待删除记录数} 条测试数据
                  </button>
                </div>
              )}
            </div>

            {/* 待删除记录列表 */}
            {analysisResult.待删除记录.length > 0 && (
              <div className="glass-effect p-6 rounded-xl">
                <h2 className="text-2xl font-bold text-red-400 mb-6">🗑️ 待删除的测试数据</h2>
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">
                    以下 {analysisResult.待删除记录.length} 条记录将因为创建时间早于 {analysisResult.分界日期} 而被删除：
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analysisResult.待删除记录.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-white font-medium">
                            {new Date(record.checkin_date).toLocaleDateString('zh-CN')}
                          </span>
                          <span className="ml-2 px-2 py-1 rounded text-xs bg-red-500/20 text-red-300">
                            测试数据
                          </span>
                        </div>
                        <div className="text-white/50 text-xs">
                          创建：{new Date(record.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>

                      {(record.xhs_url || record.xiaohongshu_url || record.xiaohongshu_link) && (
                        <div className="text-xs text-blue-300 truncate">
                          链接：{record.xhs_url || record.xiaohongshu_url || record.xiaohongshu_link}
                        </div>
                      )}

                      <div className="text-xs text-red-300 mt-2">
                        ⚠️ 此记录将被删除
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 保留记录列表 */}
            {analysisResult.保留记录.length > 0 && (
              <div className="glass-effect p-6 rounded-xl">
                <h2 className="text-2xl font-bold text-green-400 mb-6">💾 将保留的真实数据</h2>
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-300 text-sm">
                    以下 {analysisResult.保留记录.length} 条记录将因为创建时间在 {analysisResult.分界日期} 或之后而被保留：
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analysisResult.保留记录.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-white font-medium">
                            {new Date(record.checkin_date).toLocaleDateString('zh-CN')}
                          </span>
                          <span className="ml-2 px-2 py-1 rounded text-xs bg-green-500/20 text-green-300">
                            真实数据
                          </span>
                        </div>
                        <div className="text-white/50 text-xs">
                          创建：{new Date(record.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>

                      {(record.xhs_url || record.xiaohongshu_url || record.xiaohongshu_link) && (
                        <div className="text-xs text-blue-300 truncate">
                          链接：{record.xhs_url || record.xiaohongshu_url || record.xiaohongshu_link}
                        </div>
                      )}

                      <div className="text-xs text-green-300 mt-2">
                        ✅ 此记录将被保留
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 确认删除对话框 */}
        {showConfirmDialog && analysisResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-6 rounded-xl border border-white/20 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">⚠️ 确认删除测试数据</h3>

              <div className="mb-6">
                <p className="text-white/80 mb-4">
                  即将为学员 <span className="text-blue-300 font-medium">{studentId}</span> 删除测试数据：
                </p>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="text-red-300 text-sm space-y-2">
                    <p>• 将删除 <span className="font-bold">{analysisResult.统计.待删除记录数}</span> 条测试数据</p>
                    <p>• 将保留 <span className="font-bold">{analysisResult.统计.保留记录数}</span> 条真实数据</p>
                    <p>• 分界日期：<span className="font-bold">{analysisResult.分界日期}</span></p>
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