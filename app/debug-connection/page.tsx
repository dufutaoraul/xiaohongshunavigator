'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugConnection() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    const testResults: any = {}

    try {
      // 1. 测试基本连接
      console.log('Testing basic connection...')
      const { data: healthCheck, error: healthError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      testResults.healthCheck = {
        success: !healthError,
        error: healthError?.message,
        data: healthCheck
      }

      // 2. 测试特定用户查询
      console.log('Testing specific user query...')
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('student_id', 'AXCF2025010019')
        .single()

      testResults.userQuery = {
        success: !userError,
        error: userError?.message,
        data: userData
      }

      // 3. 测试所有用户查询
      console.log('Testing all users query...')
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('student_id, name, password')
        .limit(5)

      testResults.allUsers = {
        success: !allUsersError,
        error: allUsersError?.message,
        data: allUsers
      }

      // 4. 测试环境变量
      testResults.envVars = {
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        ANON_KEY_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
        HAS_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        SERVICE_KEY_LENGTH: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
      }

    } catch (error: any) {
      testResults.generalError = error.message
    }

    setResults(testResults)
    setLoading(false)
  }

  const testLogin = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          student_id: 'AXCF2025010019',
          password: 'AXCF2025010019'
        })
      })

      const result = await response.json()
      console.log('Login test result:', result)
      
      setResults(prev => ({
        ...prev,
        loginTest: {
          status: response.status,
          success: response.ok,
          data: result
        }
      }))
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        loginTest: {
          success: false,
          error: error.message
        }
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 连接调试工具</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试Supabase连接'}
          </button>
          
          <button
            onClick={testLogin}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 ml-4"
          >
            测试登录API
          </button>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">测试结果</h2>
            <div className="space-y-4">
              {Object.entries(results).map(([key, value]: [string, any]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <div className="bg-gray-50 p-3 rounded border">
                    {typeof value === 'object' ? (
                      <div className="space-y-2">
                        {Object.entries(value).map(([subKey, subValue]: [string, any]) => (
                          <div key={subKey} className="flex flex-col sm:flex-row">
                            <span className="font-medium text-gray-600 min-w-[120px] mb-1 sm:mb-0">
                              {subKey}:
                            </span>
                            <span className={`font-mono text-sm break-all ${
                              subKey === 'success' 
                                ? (subValue ? 'text-green-600' : 'text-red-600')
                                : subKey === 'error'
                                ? 'text-red-600'
                                : 'text-gray-800'
                            }`}>
                              {typeof subValue === 'object' 
                                ? JSON.stringify(subValue, null, 2)
                                : String(subValue)
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="font-mono text-sm text-gray-800 break-all">
                        {String(value)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}