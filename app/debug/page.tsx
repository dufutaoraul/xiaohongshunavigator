'use client'

import { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'

export default function DebugPage() {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [result, setResult] = useState<any>(null)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const clearLogs = () => {
    setLogs([])
    setResult(null)
  }

  const testEnvironment = async () => {
    setLoading(true)
    addLog('🔍 开始环境检测...')
    
    try {
      const response = await fetch('/api/test')
      const data = await response.json()
      
      addLog('✅ API测试端点响应成功')
      addLog(`环境变量状态: Supabase URL ${data.environment.hasSupabaseUrl ? '✅' : '❌'}`)
      addLog(`环境变量状态: Supabase Key ${data.environment.hasSupabaseKey ? '✅' : '❌'}`)
      addLog(`环境变量状态: Dify URL ${data.environment.hasDifyUrl ? '✅' : '❌'}`)
      addLog(`环境变量状态: Dify Key ${data.environment.hasDifyKey ? '✅' : '❌'}`)
      addLog(`Dify URL值: ${data.environment.difyUrl}`)
      
      setResult(data)
    } catch (error) {
      addLog(`❌ 环境检测失败: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testDirectDifyCall = async () => {
    setLoading(true)
    addLog('🚀 开始直接测试Dify调用...')
    
    try {
      // 直接调用我们的API但显示完整过程
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: 'AXCF2025040088',
          user_input: '测试AI内容生成功能',
          angle: 'efficiency',
          day_number: 1
        })
      })

      addLog(`📤 API请求已发送`)
      addLog(`📥 响应状态: ${response.status} ${response.statusText}`)
      addLog(`📥 响应头: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`)

      if (response.ok) {
        const data = await response.json()
        addLog('✅ API响应成功')
        addLog(`📊 响应数据类型: ${typeof data}`)
        addLog(`📊 响应数据键: ${Object.keys(data).join(', ')}`)
        addLog(`📊 是否包含titles: ${!!data.titles}`)
        addLog(`📊 是否包含bodies: ${!!data.bodies}`)
        addLog(`📊 是否标记为dify: ${!!data.dify}`)
        addLog(`📊 是否标记为mock: ${!!data.mock}`)
        
        if (data.titles) {
          addLog(`📊 titles数量: ${data.titles.length}`)
        }
        if (data.bodies) {
          addLog(`📊 bodies数量: ${data.bodies.length}`)
        }
        
        setResult(data)
      } else {
        const errorData = await response.text()
        addLog(`❌ API调用失败: ${errorData}`)
      }
    } catch (error) {
      addLog(`❌ 直接调用测试失败: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testDifyAPI = async () => {
    setLoading(true)
    addLog('🔥 开始直接测试Dify API...')
    
    try {
      // 首先获取环境变量
      const envResponse = await fetch('/api/test')
      const envData = await envResponse.json()
      
      if (!envData.environment.hasDifyUrl || !envData.environment.hasDifyKey) {
        addLog('❌ Dify环境变量未配置')
        return
      }

      addLog(`🎯 Dify URL: ${envData.environment.difyUrl}`)
      
      // 构造请求体
      const requestBody = {
        inputs: {
          persona: "效率提升专家",
          keywords: "AI工具,效率提升,学习方法",
          vision: "成为AI领域的专业人士",
          user_input: "测试AI内容生成功能",
          angle: "efficiency",
          day_number: 1
        },
        response_mode: "blocking",
        user: "test_user"
      }

      addLog(`📤 准备发送到Dify的请求体:`)
      addLog(JSON.stringify(requestBody, null, 2))

      // 注意：由于CORS限制，这里可能无法直接调用外部API
      // 但我们可以通过我们的后端来测试
      addLog('⚠️ 由于CORS限制，无法直接从前端调用Dify API')
      addLog('💡 建议通过后端API路由来测试Dify调用')
      
    } catch (error) {
      addLog(`❌ Dify API测试失败: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold gradient-text mb-6">🔍 Dify集成调试面板</h1>
        <p className="text-xl text-white/80">
          专门用于分析和调试Dify API调用问题
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 控制面板 */}
        <div>
          <Card title="测试控制面板" icon="🎛️" className="mb-6">
            <div className="space-y-4">
              <Button 
                onClick={testEnvironment} 
                disabled={loading}
                className="w-full"
              >
                🔍 检测环境配置
              </Button>
              
              <Button 
                onClick={testDirectDifyCall} 
                disabled={loading}
                className="w-full"
              >
                🚀 测试完整API调用流程
              </Button>
              
              <Button 
                onClick={testDifyAPI} 
                disabled={loading}
                className="w-full"
              >
                🔥 分析Dify API调用
              </Button>
              
              <Button 
                onClick={clearLogs} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                🗑️ 清空日志
              </Button>
            </div>
          </Card>

          {/* 结果数据 */}
          {result && (
            <Card title="最后响应数据" icon="📊">
              <div className="bg-black/20 border border-white/10 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-xs text-white/90 whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </Card>
          )}
        </div>

        {/* 实时日志 */}
        <div>
          <Card title="实时调试日志" icon="📝">
            <div className="bg-black/40 border border-white/10 rounded-lg p-4 h-96 overflow-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-white/50 italic">点击测试按钮开始调试...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-white/90 mb-1 leading-relaxed">
                    {log}
                  </div>
                ))
              )}
              {loading && (
                <div className="text-yellow-400 animate-pulse">
                  ⏳ 测试进行中...
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 说明信息 */}
      <Card title="调试说明" icon="💡" className="mt-8">
        <div className="text-white/80 space-y-2">
          <p><strong>🔍 检测环境配置</strong>: 检查Supabase和Dify的环境变量是否正确配置</p>
          <p><strong>🚀 测试完整API调用流程</strong>: 模拟完整的内容生成流程，查看每一步的详细信息</p>
          <p><strong>🔥 分析Dify API调用</strong>: 分析发送给Dify的请求格式和参数</p>
          <p className="text-yellow-400">
            <strong>注意</strong>: 这个页面会显示完整的调试信息，包括API调用的每个细节
          </p>
        </div>
      </Card>
    </div>
  )
}