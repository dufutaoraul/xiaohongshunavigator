'use client'

import { useState, useEffect } from 'react'
import Button from '@/app/components/Button'

interface Student {
  id: string
  student_id: string
  name: string
  real_name: string
  persona?: string
  keywords?: string
  vision?: string
}

interface MCPServiceStatus {
  isRunning: boolean
  isHealthy: boolean
  loginStatus: boolean
  version?: string
  uptime?: number
  lastError?: string
  processId?: number
}

export default function TestMCPPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [mcpStatus, setMcpStatus] = useState<MCPServiceStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [crawlResults, setCrawlResults] = useState<any[]>([])
  const [testUrl, setTestUrl] = useState('')
  const [urlCrawlResult, setUrlCrawlResult] = useState<any>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  // 获取学员列表
  const fetchStudents = async () => {
    addLog('📋 获取AXCF202501开头的学员列表...')
    try {
      const response = await fetch('/api/students/list')
      const data = await response.json()

      if (data.success) {
        setStudents(data.students)
        addLog(`✅ 成功获取 ${data.count} 个学员`)
      } else {
        addLog(`❌ 获取学员列表失败: ${data.error}`)
      }
    } catch (error) {
      addLog(`❌ 获取学员列表异常: ${error}`)
    }
  }

  // 检查MCP服务状态
  const checkMCPStatus = async () => {
    addLog('🔍 检查MCP服务状态...')
    try {
      const response = await fetch('/api/xhs/mcp-service?action=status')
      const data = await response.json()

      if (data.success) {
        setMcpStatus(data.data)
        addLog(`🚀 MCP服务状态: ${data.data.isRunning ? '运行中' : '未运行'}`)
      } else {
        addLog(`❌ MCP状态检查失败: ${data.error}`)
      }
    } catch (error) {
      addLog(`❌ MCP状态检查异常: ${error}`)
    }
  }

  // 启动MCP服务
  const startMCPService = async () => {
    addLog('🚀 启动MCP服务...')
    setLoading(true)
    try {
      const response = await fetch('/api/xhs/mcp-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      })
      const data = await response.json()

      if (data.success) {
        addLog('✅ MCP服务启动成功')
        await checkMCPStatus()
      } else {
        addLog(`❌ MCP服务启动失败: ${data.message}`)
      }
    } catch (error) {
      addLog(`❌ MCP服务启动异常: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 测试MCP连接
  const testMCPConnection = async () => {
    addLog('🔗 测试MCP协议连接...')
    try {
      const response = await fetch('/api/xhs/mcp-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection' })
      })
      const data = await response.json()

      addLog(data.success ?
        `✅ MCP连接测试成功: ${data.message}` :
        `❌ MCP连接测试失败: ${data.message}`
      )
    } catch (error) {
      addLog(`❌ MCP连接测试异常: ${error}`)
    }
  }

  // 检查登录状态
  const checkLoginStatus = async () => {
    addLog('🔐 检查小红书登录状态...')
    try {
      const response = await fetch('/api/xhs/mcp-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_login' })
      })
      const data = await response.json()

      if (data.success && data.data) {
        addLog(data.data.isLoggedIn ?
          '✅ 已登录小红书账号' :
          '❌ 未登录小红书，请手动登录'
        )
      } else {
        addLog('❌ 无法检查登录状态')
      }
    } catch (error) {
      addLog(`❌ 登录状态检查异常: ${error}`)
    }
  }

  // 简单连接测试
  const simpleConnectionTest = async () => {
    addLog('🔍 开始简单连接测试...')
    setLoading(true)

    try {
      const response = await fetch('/api/xhs/simple-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl || 'test' })
      })
      const data = await response.json()

      if (data.success) {
        addLog('✅ 连接测试完成')
        data.data.testResults.forEach((result: any) => {
          if (result.error) {
            addLog(`❌ ${result.method}: ${result.error}`)
          } else {
            addLog(`✅ ${result.method}: HTTP ${result.status} ${result.ok ? 'OK' : 'FAIL'}`)
            if (result.data && typeof result.data === 'object') {
              addLog(`📊 响应: ${JSON.stringify(result.data).slice(0, 200)}...`)
            }
          }
        })
      } else {
        addLog(`❌ 连接测试失败: ${data.message}`)
      }
    } catch (error) {
      addLog(`❌ 连接测试异常: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 测试修复后的URL抓取（按官方文档）
  const testFixedUrlCrawl = async () => {
    if (!testUrl.trim()) {
      addLog('❌ 请输入小红书主页URL')
      return
    }

    addLog(`🎯 使用官方文档方法抓取URL: ${testUrl}`)
    setLoading(true)
    setUrlCrawlResult(null)

    try {
      const response = await fetch('/api/xhs/crawl-url-fixed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl })
      })
      const data = await response.json()

      if (data.success) {
        addLog('✅ 官方文档方法抓取成功！')
        setUrlCrawlResult(data.data.result)
        addLog(`🔧 使用的工具: ${data.data.tool_used}`)
        addLog(`📊 可用工具列表: ${data.data.available_tools?.join(', ')}`)
        addLog(`📊 获取到数据: ${JSON.stringify(data.data.result).slice(0, 100)}...`)
      } else {
        addLog(`❌ 官方文档方法抓取失败: ${data.message || data.error}`)
        if (data.debug) {
          addLog(`🔍 会话状态: ${data.debug.session_initialized ? '已初始化' : '未初始化'}`)
          addLog(`🔍 可用工具: ${data.debug.available_tools?.map((t: any) => t.name).join(', ') || '无'}`)
          addLog(`🔍 尝试的工具: ${data.debug.tried_tools?.join(', ')}`)
        }
      }
    } catch (error) {
      addLog(`❌ 官方文档方法抓取异常: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 测试单个URL抓取（旧方法）
  const testUrlCrawl = async () => {
    if (!testUrl.trim()) {
      addLog('❌ 请输入小红书主页URL')
      return
    }

    addLog(`🎯 使用旧方法抓取URL: ${testUrl}`)
    setLoading(true)
    setUrlCrawlResult(null)

    try {
      const response = await fetch('/api/xhs/crawl-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl })
      })
      const data = await response.json()

      if (data.success) {
        addLog('✅ 旧方法URL抓取成功！')
        setUrlCrawlResult(data.data)
        addLog(`📊 获取到数据: ${JSON.stringify(data.data).slice(0, 100)}...`)
      } else {
        addLog(`❌ 旧方法URL抓取失败: ${data.message || data.error}`)
        if (data.debug) {
          addLog(`🔍 调试信息: ${JSON.stringify(data.debug)}`)
        }
      }
    } catch (error) {
      addLog(`❌ 旧方法URL抓取异常: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 测试真实数据抓取
  const testRealDataCrawl = async () => {
    if (students.length === 0) {
      addLog('❌ 请先获取学员列表')
      return
    }

    addLog('🎯 开始测试真实数据抓取...')
    setCrawlResults([])

    for (const student of students.slice(0, 3)) { // 只测试前3个学员
      addLog(`🔍 正在抓取学员 ${student.student_id} (${student.name || student.real_name}) 的数据...`)

      try {
        const response = await fetch('/api/xhs/crawl-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: student.student_id,
            require_real_data: true  // 明确要求真实数据
          })
        })
        const data = await response.json()

        if (data.success) {
          addLog(`✅ 成功抓取 ${student.student_id} 的数据`)
          setCrawlResults(prev => [...prev, { student, data: data.data }])
        } else {
          addLog(`❌ 抓取 ${student.student_id} 失败: ${data.message || data.error}`)
        }
      } catch (error) {
        addLog(`❌ 抓取 ${student.student_id} 异常: ${error}`)
      }

      // 延时避免请求过快
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // 页面加载时初始化
  useEffect(() => {
    addLog('🌟 MCP测试页面已加载')
    fetchStudents()
    checkMCPStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            小红书MCP服务测试
          </h1>
          <p className="text-gray-600">
            测试真实数据抓取功能 - 绝不使用虚拟数据
          </p>
        </div>

        {/* 控制面板 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">控制面板</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={fetchStudents}
              className="bg-blue-500 hover:bg-blue-600"
            >
              获取学员列表
            </Button>
            <Button
              onClick={checkMCPStatus}
              className="bg-green-500 hover:bg-green-600"
            >
              检查服务状态
            </Button>
            <Button
              onClick={startMCPService}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {loading ? '启动中...' : '启动MCP服务'}
            </Button>
            <Button
              onClick={testMCPConnection}
              className="bg-orange-500 hover:bg-orange-600"
            >
              测试MCP连接
            </Button>
            <Button
              onClick={checkLoginStatus}
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              检查登录状态
            </Button>
            <Button
              onClick={testRealDataCrawl}
              className="bg-red-500 hover:bg-red-600 md:col-span-3"
            >
              🎯 测试真实数据抓取
            </Button>
          </div>
        </div>

        {/* URL测试面板 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">🎯 单个URL测试</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                小红书主页URL（例如：https://www.xiaohongshu.com/user/profile/xxx）
              </label>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="请输入小红书主页URL..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={simpleConnectionTest}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? '测试中...' : '🔍 简单连接测试'}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={testFixedUrlCrawl}
                  disabled={loading || !testUrl.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? '抓取中...' : '📖 官方文档方法'}
                </Button>
                <Button
                  onClick={testUrlCrawl}
                  disabled={loading || !testUrl.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? '抓取中...' : '🔧 旧方法对比'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MCP服务状态 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">MCP服务状态</h3>
            {mcpStatus ? (
              <div className="space-y-2 text-sm">
                <div className={`p-2 rounded ${mcpStatus.isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  运行状态: {mcpStatus.isRunning ? '✅ 运行中' : '❌ 未运行'}
                </div>
                <div className={`p-2 rounded ${mcpStatus.isHealthy ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  健康状态: {mcpStatus.isHealthy ? '✅ 健康' : '⚠️ 异常'}
                </div>
                <div className={`p-2 rounded ${mcpStatus.loginStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  登录状态: {mcpStatus.loginStatus ? '✅ 已登录' : '❌ 未登录'}
                </div>
                {mcpStatus.version && (
                  <div className="p-2 bg-gray-100 rounded">版本: {mcpStatus.version}</div>
                )}
                {mcpStatus.lastError && (
                  <div className="p-2 bg-red-100 text-red-800 rounded text-xs">
                    错误: {mcpStatus.lastError}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">正在检查状态...</div>
            )}
          </div>

          {/* 学员列表 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
              AXCF202501学员列表 ({students.length}人)
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {students.map(student => (
                <div key={student.id} className="p-3 bg-gray-50 rounded text-sm">
                  <div className="font-medium">{student.student_id}</div>
                  <div className="text-gray-600">{student.name || student.real_name || '未设置姓名'}</div>
                  {student.persona && (
                    <div className="text-xs text-blue-600 mt-1">人设: {student.persona}</div>
                  )}
                </div>
              ))}
              {students.length === 0 && (
                <div className="text-gray-500 text-center py-4">暂无学员数据</div>
              )}
            </div>
          </div>
        </div>

        {/* URL抓取结果 */}
        {urlCrawlResult && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">🎯 URL抓取结果</h3>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="font-medium text-blue-800 mb-2">
                抓取URL: {testUrl}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-white rounded shadow-sm">
                  <div className="text-sm text-gray-600">点赞数</div>
                  <div className="text-lg font-bold text-red-500">
                    {urlCrawlResult.likes || '获取中...'}
                  </div>
                </div>
                <div className="p-3 bg-white rounded shadow-sm">
                  <div className="text-sm text-gray-600">评论数</div>
                  <div className="text-lg font-bold text-blue-500">
                    {urlCrawlResult.comments || '获取中...'}
                  </div>
                </div>
                <div className="p-3 bg-white rounded shadow-sm">
                  <div className="text-sm text-gray-600">收藏数</div>
                  <div className="text-lg font-bold text-green-500">
                    {urlCrawlResult.collections || '获取中...'}
                  </div>
                </div>
              </div>
              <details className="mt-2">
                <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                  查看完整数据
                </summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto border">
                  {JSON.stringify(urlCrawlResult, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        {/* 抓取结果 */}
        {crawlResults.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">抓取结果</h3>
            <div className="space-y-4">
              {crawlResults.map((result, index) => (
                <div key={index} className="p-4 bg-green-50 border border-green-200 rounded">
                  <div className="font-medium text-green-800">
                    {result.student.student_id} - {result.student.name || result.student.real_name}
                  </div>
                  <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 实时日志 */}
        <div className="bg-black text-green-400 p-4 rounded-lg shadow font-mono text-sm">
          <h3 className="text-lg font-semibold mb-4 text-white">实时日志</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
          <div className="mt-4">
            <Button
              onClick={() => setLogs([])}
              className="bg-gray-700 hover:bg-gray-600 text-white text-xs"
            >
              清空日志
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}