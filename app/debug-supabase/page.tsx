'use client'

import { useState } from 'react'

export default function DebugSupabase() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSupabaseConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-supabase', {
        method: 'GET'
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setLoading(false)
  }

  const testUserQuery = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'test_user_query',
          student_id: 'AXCF2025010006'
        })
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Supabase连接调试</h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={testSupabaseConnection}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '测试中...' : '测试Supabase连接'}
            </button>
            
            <button
              onClick={testUserQuery}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '查询中...' : '测试用户查询'}
            </button>
          </div>
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