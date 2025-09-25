'use client'

import { useState } from 'react'

export default function CleanupAXCF202505Page() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const executeCleanup = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test/check-axcf202505-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || '删除操作失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            🧹 AXCF202505 测试数据清理工具
          </h1>

          <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4 mb-6">
            <h2 className="text-yellow-200 font-semibold mb-2">⚠️ 清理说明</h2>
            <ul className="text-yellow-100 space-y-1 text-sm">
              <li>• 将删除 7 条 AXCF202505 的打卡安排数据</li>
              <li>• 将删除 1 条 AXCF202505 的打卡记录</li>
              <li>• 保留 12 个 AXCF202505 学员账户（不会删除账户）</li>
              <li>• 清理后学员可以重新自主设置打卡时间</li>
            </ul>
          </div>

          <div className="text-center mb-8">
            <button
              onClick={executeCleanup}
              disabled={isLoading}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 hover:scale-105'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  正在清理...
                </div>
              ) : (
                '🗑️ 执行清理操作'
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 mb-6">
              <h3 className="text-red-200 font-semibold mb-2">❌ 清理失败</h3>
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-4">
              <h3 className="text-green-200 font-semibold mb-3">✅ 清理完成</h3>

              {result.operations?.map((op: any, index: number) => (
                <div key={index} className="mb-3 last:mb-0">
                  {op.operation === 'delete_checkin_records' && (
                    <div className="text-green-100 text-sm">
                      🗂️ 打卡记录：删除了 {op.deletedCount} 条记录
                      {op.error && <span className="text-red-300 ml-2">({op.error})</span>}
                    </div>
                  )}

                  {op.operation === 'delete_checkin_schedules' && (
                    <div className="text-green-100 text-sm">
                      📅 打卡安排：删除了 {op.deletedCount} 条安排
                      {op.error && <span className="text-red-300 ml-2">({op.error})</span>}
                    </div>
                  )}

                  {op.operation === 'verification' && (
                    <div className="text-green-100 text-sm">
                      🔍 验证结果：剩余安排 {op.remainingSchedules} 条，剩余记录 {op.remainingRecords} 条，学员账户 {op.remainingUsers} 个
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-4 pt-3 border-t border-green-400/30">
                <p className="text-green-100 text-sm">
                  🎉 AXCF202505 学员现在可以重新登录并自主设置打卡时间了！
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <a
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              🏠 返回管理后台
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}