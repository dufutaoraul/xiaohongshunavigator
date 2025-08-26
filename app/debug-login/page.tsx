'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DebugLoginPage() {
  const [studentId, setStudentId] = useState('test001')
  const [password, setPassword] = useState('123456')
  const [name, setName] = useState('测试学员')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  // 创建测试用户
  const createTestUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          password: password,
          name: name
        })
      })

      const data = await response.json()
      setResult(`创建用户结果: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`创建用户错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 测试登录
  const testLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          student_id: studentId,
          password: password
        })
      })

      const data = await response.json()
      setResult(`登录结果: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`登录错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 查看现有用户
  const viewUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-user', {
        method: 'GET'
      })

      const data = await response.json()
      setResult(`现有用户: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`查看用户错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">登录调试工具</h1>
        
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">测试用户信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">学号</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50"
                placeholder="学号"
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">密码</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50"
                placeholder="密码"
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50"
                placeholder="姓名"
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={createTestUser}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
            >
              {loading ? '处理中...' : '创建测试用户'}
            </button>
            <button
              onClick={testLogin}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {loading ? '处理中...' : '测试登录'}
            </button>
            <button
              onClick={viewUsers}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50"
            >
              {loading ? '处理中...' : '查看现有用户'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">结果</h2>
            <pre className="text-white text-sm overflow-auto bg-black/20 p-4 rounded">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
