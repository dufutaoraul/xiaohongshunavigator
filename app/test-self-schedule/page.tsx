'use client'

import { useState, useEffect } from 'react'

export default function TestSelfSchedulePage() {
  const [studentId, setStudentId] = useState('AXCF2025050003')
  const [apiData, setApiData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const testAPI = async () => {
    if (!studentId) return
    
    setLoading(true)
    setError('')
    setApiData(null)
    
    try {
      const response = await fetch(`/api/student/self-schedule`, {
        headers: {
          'Authorization': `Bearer ${studentId}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiData(data)
      } else {
        const errorText = await response.text()
        setError(`API错误 ${response.status}: ${errorText}`)
      }
    } catch (err) {
      setError(`网络错误: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testAPI()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">自主设定权限测试</h1>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">测试用户</h2>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30"
              placeholder="输入学号"
            />
            <button
              onClick={testAPI}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {loading ? '测试中...' : '测试API'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <h3 className="text-red-300 font-semibold mb-2">错误</h3>
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {apiData && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">API响应数据</h2>
            <pre className="bg-black/30 rounded-lg p-4 text-green-300 text-sm overflow-auto">
              {JSON.stringify(apiData, null, 2)}
            </pre>
            
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-semibold text-white">逻辑判断</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${apiData.can_self_schedule ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'} border`}>
                  <h4 className="font-semibold text-white mb-2">权限检查</h4>
                  <p className={apiData.can_self_schedule ? 'text-green-300' : 'text-red-300'}>
                    {apiData.can_self_schedule ? '✅ 有自主设定权限' : '❌ 无自主设定权限'}
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg ${!apiData.has_used_opportunity ? 'bg-green-500/20 border-green-500/50' : 'bg-yellow-500/20 border-yellow-500/50'} border`}>
                  <h4 className="font-semibold text-white mb-2">使用状态</h4>
                  <p className={!apiData.has_used_opportunity ? 'text-green-300' : 'text-yellow-300'}>
                    {!apiData.has_used_opportunity ? '✅ 未使用过机会' : '⚠️ 已使用过机会'}
                  </p>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${apiData.can_self_schedule && !apiData.has_used_opportunity ? 'bg-blue-500/20 border-blue-500/50' : 'bg-gray-500/20 border-gray-500/50'} border`}>
                <h4 className="font-semibold text-white mb-2">最终结果</h4>
                <p className={apiData.can_self_schedule && !apiData.has_used_opportunity ? 'text-blue-300' : 'text-gray-300'}>
                  {apiData.can_self_schedule && !apiData.has_used_opportunity 
                    ? '🎯 应该显示自主设定界面' 
                    : '🚫 不应该显示自主设定界面'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <a 
            href={`/checkin?student_id=${studentId}`}
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            前往打卡页面测试
          </a>
        </div>
      </div>
    </div>
  )
}
