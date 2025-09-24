'use client'

import { useState } from 'react'

interface CleanupPreview {
  schedules_to_delete: {
    count: number
    data: Array<{
      id: string
      student_id: string
      start_date: string
      end_date: string
      schedule_type: string
      created_by: string
      is_active: boolean
    }>
  }
  users_to_reset: {
    count: number
    data: Array<{
      student_id: string
      name: string
      can_self_schedule: boolean
      has_used_self_schedule: boolean
      self_schedule_deadline: string | null
    }>
  }
  preserved_axcf202501_schedules: {
    count: number
    data: Array<{
      id: string
      student_id: string
      start_date: string
      end_date: string
      schedule_type: string
      created_by: string
      is_active: boolean
    }>
  }
}

interface CleanupResult {
  schedules_deleted: number
  users_reset: number
  remaining_non_axcf202501_schedules: number
  deleted_student_ids: string[]
  reset_users: Array<{
    student_id: string
    name: string
    previous_can_self_schedule: boolean
    previous_has_used_self_schedule: boolean
  }>
}

export default function CleanupTestDataPage() {
  const [preview, setPreview] = useState<CleanupPreview | null>(null)
  const [result, setResult] = useState<CleanupResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadPreview = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/cleanup-test-data')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '加载预览失败')
      }

      setPreview(data.cleanup_preview)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载预览失败')
    } finally {
      setIsLoading(false)
    }
  }

  const executeCleanup = async () => {
    if (!confirm('确定要执行数据清理吗？这个操作无法撤销！')) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/cleanup-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirm_cleanup: 'YES_CLEANUP_TEST_DATA'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '清理失败')
      }

      setResult(data.cleanup_summary)
      alert('数据清理完成！')
    } catch (err) {
      setError(err instanceof Error ? err.message : '清理失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative">
      <div className="cosmic-bg"></div>

      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="glass-effect p-8 mb-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4 breathing-glow">🧹</div>
              <h1 className="text-3xl font-bold gradient-text mb-4">
                测试数据清理工具
              </h1>
              <p className="text-white/70">
                清理非AXCF202501开头的checkin_schedules数据，并重置对应用户权限
              </p>
            </div>

            <div className="flex gap-4 justify-center mb-8">
              <button
                onClick={loadPreview}
                disabled={isLoading}
                className="cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? '加载中...' : '预览清理数据'}
              </button>

              {preview && (
                <button
                  onClick={executeCleanup}
                  disabled={isLoading}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? '清理中...' : '执行清理'}
                </button>
              )}
            </div>

            {error && (
              <div className="glass-effect p-4 border border-red-500/30 mb-8">
                <div className="text-red-400 text-sm">{error}</div>
              </div>
            )}

            {preview && (
              <div className="space-y-8">
                <div className="glass-effect p-6 border border-yellow-500/30">
                  <h2 className="text-xl font-bold text-yellow-300 mb-4">
                    ⚠️ 清理预览
                  </h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">
                        将删除的打卡安排 ({preview.schedules_to_delete.count}条)
                      </h3>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {preview.schedules_to_delete.data.map((schedule) => (
                          <div key={schedule.id} className="bg-white/5 p-3 rounded text-sm">
                            <div className="text-white font-medium">{schedule.student_id}</div>
                            <div className="text-white/60">
                              {schedule.start_date} ~ {schedule.end_date}
                            </div>
                            <div className="text-white/60 text-xs">
                              类型: {schedule.schedule_type} | 创建者: {schedule.created_by}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">
                        将重置权限的用户 ({preview.users_to_reset.count}个)
                      </h3>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {preview.users_to_reset.data.map((user) => (
                          <div key={user.student_id} className="bg-white/5 p-3 rounded text-sm">
                            <div className="text-white font-medium">
                              {user.student_id} - {user.name}
                            </div>
                            <div className="text-white/60 text-xs">
                              当前权限: {user.can_self_schedule ? '是' : '否'} |
                              已使用: {user.has_used_self_schedule ? '是' : '否'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/20">
                    <h3 className="text-lg font-semibold text-green-300 mb-3">
                      ✅ 保留的AXCF202501数据 ({preview.preserved_axcf202501_schedules.count}条)
                    </h3>
                    <div className="max-h-40 overflow-y-auto">
                      {preview.preserved_axcf202501_schedules.data.map((schedule) => (
                        <div key={schedule.id} className="text-sm text-green-200">
                          {schedule.student_id} - {schedule.start_date} ~ {schedule.end_date}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="glass-effect p-6 border border-green-500/30">
                <h2 className="text-xl font-bold text-green-300 mb-4">
                  ✅ 清理完成
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">清理统计</h3>
                    <div className="space-y-2 text-sm">
                      <div className="text-white/80">
                        删除打卡安排: <span className="text-green-300">{result.schedules_deleted}</span> 条
                      </div>
                      <div className="text-white/80">
                        重置用户权限: <span className="text-green-300">{result.users_reset}</span> 个
                      </div>
                      <div className="text-white/80">
                        剩余非AXCF202501数据: <span className="text-green-300">{result.remaining_non_axcf202501_schedules}</span> 条
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">重置的用户</h3>
                    <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                      {result.reset_users.map((user) => (
                        <div key={user.student_id} className="text-white/70">
                          {user.student_id} - {user.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}