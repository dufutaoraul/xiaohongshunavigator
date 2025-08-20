'use client'

import { useState } from 'react'

export default function DebugAuthPage() {
  const [studentId, setStudentId] = useState('AXCF2025010006')
  const [debugResult, setDebugResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleDebug = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId })
      })

      const result = await response.json()
      setDebugResult(result)
    } catch (error) {
      console.error('Debug error:', error)
      setDebugResult({ error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🔍 登录调试工具</h1>
        
        <div className="glass-effect p-6 rounded-xl mb-6">
          <div className="mb-4">
            <label className="block text-white font-medium mb-2">学号</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
              placeholder="输入要调试的学号"
            />
          </div>
          
          <button
            onClick={handleDebug}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-300 disabled:opacity-50"
          >
            {loading ? '调试中...' : '开始调试'}
          </button>
        </div>

        {debugResult && (
          <div className="glass-effect p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4">调试结果</h2>
            <pre className="bg-black/30 p-4 rounded-lg text-green-400 text-sm overflow-auto">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}