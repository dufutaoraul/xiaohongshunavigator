'use client'

import { useState } from 'react'

export default function DateCalculationTestPage() {
  const [testStudentId, setTestStudentId] = useState('AXCF202505001')
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 模拟API调用测试
  const testDateCalculation = async () => {
    setIsLoading(true)
    setTestResults(null)

    try {
      const response = await fetch(`/api/student/self-schedule?student_id=${testStudentId}`, {
        headers: {
          'Authorization': `Bearer ${testStudentId}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTestResults({
          success: true,
          data,
          currentDate: new Date().toISOString().split('T')[0]
        })
      } else {
        const errorData = await response.json()
        setTestResults({
          success: false,
          error: errorData,
          currentDate: new Date().toISOString().split('T')[0]
        })
      }
    } catch (error) {
      setTestResults({
        success: false,
        error: { message: `网络错误: ${error instanceof Error ? error.message : String(error)}` },
        currentDate: new Date().toISOString().split('T')[0]
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 手动计算用户注册时间+6个月的示例
  const calculateExpectedDeadline = (createdAt: string) => {
    const created = new Date(createdAt)
    const deadline = new Date(created)
    deadline.setMonth(deadline.getMonth() + 6)
    return deadline.toISOString().split('T')[0]
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 自主设定日期计算测试
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试学员自主设定日期范围</h2>

          <div className="flex items-center space-x-4 mb-4">
            <input
              type="text"
              value={testStudentId}
              onChange={(e) => setTestStudentId(e.target.value)}
              placeholder="输入学员ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={testDateCalculation}
              disabled={isLoading || !testStudentId.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '🔄 测试中...' : '🧪 测试日期计算'}
            </button>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <h3 className="font-medium text-blue-900 mb-2">📋 测试说明</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• <strong>正确逻辑:</strong> 截止日期应该基于用户注册时间 + 6个月</li>
              <li>• <strong>错误逻辑:</strong> 截止日期基于当前日期 + 6个月</li>
              <li>• <strong>预期结果:</strong> 第一张截图显示的2026-02-09应该是正确的</li>
              <li>• <strong>问题结果:</strong> 第二张截图显示的2026年3月23日是错误的</li>
            </ul>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            当前日期: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{new Date().toISOString().split('T')[0]}</span>
          </div>
        </div>

        {testResults && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {testResults.success ? '✅ 测试结果' : '❌ 测试结果'}
            </h2>

            {testResults.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-2">📅 日期信息</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">截止日期: </span>
                        <span className="font-mono bg-green-100 px-2 py-1 rounded">
                          {testResults.data.deadline}
                        </span>
                        <span className="text-green-700 ml-2">
                          ({formatDate(testResults.data.deadline)})
                        </span>
                      </div>
                      {testResults.data.date_range && (
                        <div>
                          <span className="text-gray-600">可选范围: </span>
                          <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                            {testResults.data.date_range.earliest}
                          </span>
                          <span className="mx-2">至</span>
                          <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                            {testResults.data.date_range.latest}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">🔍 状态信息</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">可以自主设定: </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          testResults.data.can_self_schedule
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {testResults.data.can_self_schedule ? '是' : '否'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">已使用机会: </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          testResults.data.has_used_opportunity
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {testResults.data.has_used_opportunity ? '是' : '否'}
                        </span>
                      </div>
                      {testResults.data.is_expired !== undefined && (
                        <div>
                          <span className="text-gray-600">是否过期: </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            testResults.data.is_expired
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {testResults.data.is_expired ? '是' : '否'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {testResults.data.message && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-600">消息: </span>
                    <span className="text-gray-800">{testResults.data.message}</span>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">🔧 完整API响应</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(testResults.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-900 mb-2">❌ 错误信息</h3>
                  <div className="text-red-800">
                    {testResults.error.message || testResults.error.error || '未知错误'}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">🔧 完整错误响应</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(testResults.error, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}