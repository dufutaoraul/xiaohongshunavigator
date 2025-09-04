'use client'

import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

export default function TestUserPage() {
  const { isAuthenticated, user } = useAuth()
  const studentId = user?.student_id
  const [userInfo, setUserInfo] = useState<any>(null)
  const [selfScheduleInfo, setSelfScheduleInfo] = useState<any>(null)
  const [scheduleInfo, setScheduleInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkUserInfo = useCallback(async () => {
    if (!studentId) return

    setLoading(true)
    try {
      // 检查用户基本信息
      console.log('检查用户:', studentId)

      // 检查自主设定权限
      const selfScheduleResponse = await fetch('/api/student/self-schedule', {
        headers: {
          'Authorization': `Bearer ${studentId}`
        }
      })

      if (selfScheduleResponse.ok) {
        const selfScheduleData = await selfScheduleResponse.json()
        setSelfScheduleInfo(selfScheduleData)
        console.log('自主设定权限数据:', selfScheduleData)
      } else {
        console.error('自主设定权限API失败:', selfScheduleResponse.status)
        setSelfScheduleInfo({ error: `API失败: ${selfScheduleResponse.status}` })
      }

      // 检查打卡安排
      const scheduleResponse = await fetch(`/api/admin/checkin-schedule?student_id=${studentId}`)
      const scheduleResult = await scheduleResponse.json()
      setScheduleInfo(scheduleResult)
      console.log('打卡安排数据:', scheduleResult)

    } catch (error) {
      console.error('检查用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    if (isAuthenticated && studentId) {
      checkUserInfo()
    }
  }, [isAuthenticated, studentId, checkUserInfo])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl mb-4">请先登录</h1>
          <Link href="/" className="text-blue-300 hover:text-blue-200">返回首页</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">用户信息测试页面</h1>
        
        <div className="grid gap-6">
          {/* 基本信息 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">基本信息</h2>
            <div className="text-white/80">
              <p><strong>学号:</strong> {studentId}</p>
              <p><strong>认证状态:</strong> {isAuthenticated ? '已认证' : '未认证'}</p>
            </div>
          </div>

          {/* 自主设定权限信息 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">自主设定权限</h2>
            {loading ? (
              <p className="text-white/60">加载中...</p>
            ) : selfScheduleInfo ? (
              <pre className="text-white/80 text-sm overflow-auto bg-black/20 p-4 rounded">
                {JSON.stringify(selfScheduleInfo, null, 2)}
              </pre>
            ) : (
              <p className="text-white/60">暂无数据</p>
            )}
          </div>

          {/* 打卡安排信息 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">打卡安排</h2>
            {loading ? (
              <p className="text-white/60">加载中...</p>
            ) : scheduleInfo ? (
              <pre className="text-white/80 text-sm overflow-auto bg-black/20 p-4 rounded">
                {JSON.stringify(scheduleInfo, null, 2)}
              </pre>
            ) : (
              <p className="text-white/60">暂无数据</p>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">操作</h2>
            <div className="flex gap-4">
              <button
                onClick={checkUserInfo}
                disabled={loading}
                className="px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? '检查中...' : '重新检查'}
              </button>
              <Link
                href="/checkin"
                className="px-4 py-2 bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-lg transition-colors"
              >
                前往打卡页面
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 rounded-lg transition-colors"
              >
                返回首页
              </Link>
            </div>
          </div>

          {/* 测试用户建议 */}
          <div className="bg-yellow-500/10 backdrop-blur-sm rounded-lg p-6 border border-yellow-500/20">
            <h2 className="text-xl font-semibold text-yellow-300 mb-4">测试建议</h2>
            <div className="text-yellow-200/80 space-y-2">
              <p><strong>有自主设定权限且无打卡安排的测试用户:</strong></p>
              <p>学号: AXCF2025050010 (真水无香)</p>
              <p>如果当前用户不是这个学号，请退出登录后用此学号重新登录测试。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
