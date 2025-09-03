'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminDebugPage() {
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [apiUserData, setApiUserData] = useState<any>(null)

  useEffect(() => {
    // 获取localStorage中的信息
    const userSession = localStorage.getItem('userSession')
    const lastCredentials = localStorage.getItem('lastCredentials')
    
    setDebugInfo({
      userSession: userSession ? JSON.parse(userSession) : null,
      lastCredentials: lastCredentials ? JSON.parse(lastCredentials) : null
    })

    // 如果有用户，获取API数据
    if (user?.student_id) {
      fetchUserFromAPI(user.student_id)
    }
  }, [user])

  const fetchUserFromAPI = async (studentId: string) => {
    try {
      const response = await fetch(`/api/user?student_id=${studentId}`)
      if (response.ok) {
        const data = await response.json()
        setApiUserData(data)
      }
    } catch (error) {
      console.error('获取用户API数据失败:', error)
    }
  }

  const testLogin = async (studentId: string, password: string) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          student_id: studentId,
          password: password
        })
      })

      const data = await response.json()
      console.log('登录测试结果:', data)
      
      if (data.success) {
        // 刷新页面以更新状态
        window.location.reload()
      }
    } catch (error) {
      console.error('登录测试失败:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🔍 管理员权限调试页面</h1>
        
        {/* 当前用户状态 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">当前用户状态</h2>
          <div className="space-y-2 text-white">
            <p><strong>是否已认证:</strong> {isAuthenticated ? '✅ 是' : '❌ 否'}</p>
            <p><strong>是否管理员:</strong> {isAdmin ? '✅ 是' : '❌ 否'}</p>
            <p><strong>用户ID:</strong> {user?.student_id || '未登录'}</p>
            <p><strong>用户名:</strong> {user?.name || '未登录'}</p>
            <p><strong>用户角色:</strong> {user?.role || '未设置'}</p>
          </div>
        </div>

        {/* AuthContext数据 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">AuthContext 数据</h2>
          <pre className="text-white text-sm bg-black/20 p-4 rounded overflow-auto">
            {JSON.stringify({ user, isAuthenticated, isAdmin }, null, 2)}
          </pre>
        </div>

        {/* localStorage数据 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">localStorage 数据</h2>
          <pre className="text-white text-sm bg-black/20 p-4 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* API用户数据 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">API 用户数据</h2>
          <pre className="text-white text-sm bg-black/20 p-4 rounded overflow-auto">
            {JSON.stringify(apiUserData, null, 2)}
          </pre>
        </div>

        {/* 测试登录 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">测试管理员登录</h2>
          <div className="space-y-4">
            <button
              onClick={() => testLogin('AXCF2025010002', 'AXCF2025010002')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mr-4"
            >
              登录为 缘起 (AXCF2025010002)
            </button>
            <button
              onClick={() => testLogin('AXCF2025010003', 'AXCF2025010003')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              登录为 兔子 (AXCF2025010003)
            </button>
          </div>
        </div>

        {/* 清除缓存 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">清除缓存</h2>
          <button
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            清除所有缓存并刷新
          </button>
        </div>
      </div>
    </div>
  )
}
