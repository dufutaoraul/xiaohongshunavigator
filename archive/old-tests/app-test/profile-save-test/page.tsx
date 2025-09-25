'use client'

import { useState } from 'react'

export default function ProfileSaveTestPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    student_id: 'TEST001',
    name: '测试用户',
    real_name: '测试真实姓名',
    persona: '测试人设定位',
    keywords: '测试,关键词,列表',
    vision: '测试90天愿景'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const testProfileSave = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/test/profile-save-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      setTestResult({
        ...result,
        status: response.status,
        statusText: response.statusText
      })

    } catch (error) {
      setTestResult({
        success: false,
        error: `网络请求失败: ${error instanceof Error ? error.message : String(error)}`,
        status: 'Network Error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 个人信息保存功能测试
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试数据</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学号
              </label>
              <input
                type="text"
                name="student_id"
                value={formData.student_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学员姓名
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                真实姓名
              </label>
              <input
                type="text"
                name="real_name"
                value={formData.real_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关键词
              </label>
              <input
                type="text"
                name="keywords"
                value={formData.keywords}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                人设定位
              </label>
              <textarea
                name="persona"
                value={formData.persona}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                90天愿景
              </label>
              <textarea
                name="vision"
                value={formData.vision}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={testProfileSave}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? '🔄 测试中...' : '🧪 开始测试保存功能'}
          </button>
        </div>

        {testResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {testResult.success ? '✅ 测试结果' : '❌ 测试结果'}
            </h2>

            <div className="space-y-4">
              <div>
                <span className="font-medium">状态: </span>
                <span className={`px-2 py-1 rounded text-sm ${
                  testResult.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {testResult.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>

              {testResult.environment && (
                <div>
                  <span className="font-medium">环境: </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {testResult.environment}
                  </span>
                </div>
              )}

              {testResult.message && (
                <div>
                  <span className="font-medium">消息: </span>
                  <span>{testResult.message}</span>
                </div>
              )}

              {testResult.error && (
                <div>
                  <span className="font-medium">错误: </span>
                  <span className="text-red-600">{testResult.error}</span>
                </div>
              )}

              {testResult.timestamp && (
                <div>
                  <span className="font-medium">时间: </span>
                  <span className="text-gray-600">{testResult.timestamp}</span>
                </div>
              )}

              {testResult.data && (
                <div>
                  <span className="font-medium">返回数据: </span>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              )}

              {testResult.details && (
                <div>
                  <span className="font-medium">详细信息: </span>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}