'use client'

import { useState } from 'react'

export default function DebugPassword() {
  const [studentId, setStudentId] = useState('AXCF2025010006')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const debugPassword = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: studentId
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
        <h1 className="text-3xl font-bold text-white mb-8">密码详细调试</h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-white mb-2">学号</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 text-white rounded border border-white/30"
            />
          </div>
          
          <button
            onClick={debugPassword}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? '分析中...' : '分析密码'}
          </button>
        </div>

        {result && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">密码分析结果</h2>
            <pre className="text-white text-sm overflow-auto bg-black/30 p-4 rounded max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.passwordAnalysis && (
              <div className="mt-4 text-white">
                <h3 className="text-lg font-bold mb-2">快速诊断：</h3>
                <p>实际密码长度: {result.passwordAnalysis.length}</p>
                <p>去空格后长度: {result.passwordAnalysis.trimmedLength}</p>
                <p>是否包含空格: {result.passwordAnalysis.hasWhitespace ? '是' : '否'}</p>
                <p>字节长度: {result.passwordAnalysis.bytes}</p>
                <p className="mt-2 font-bold">
                  建议: {result.recommendation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}