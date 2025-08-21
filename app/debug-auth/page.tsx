'use client'

import { useState } from 'react'

export default function DebugAuth() {
  const [studentId, setStudentId] = useState('AXCF2025010006')
  const [password, setPassword] = useState('12345678')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const debugAuth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          password: password
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Unknown error' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">认证调试工具</h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-white mb-2">学号</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-white/20 text-white rounded border border-white/30"
              />
            </div>
            <div>
              <label className="block text-white mb-2">密码</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white/20 text-white rounded border border-white/30"
              />
            </div>
          </div>
          
          <button
            onClick={debugAuth}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '调试中...' : '开始调试'}
          </button>
        </div>

        {result && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">调试结果</h2>
            <pre className="text-white text-sm overflow-auto bg-black/30 p-4 rounded max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}