'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Square, 
  RotateCcw, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Terminal,
  Settings,
  Download
} from 'lucide-react'

interface ServiceStatus {
  isRunning: boolean
  isHealthy: boolean
  loginStatus: boolean
  version?: string
  uptime?: number
  lastError?: string
  processId?: number
}

export default function MCPServicePage() {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  // 获取服务状态
  const fetchServiceStatus = async () => {
    try {
      const response = await fetch('/api/xhs/mcp-service?action=status')
      const data = await response.json()
      
      if (data.success) {
        setServiceStatus(data.data)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '获取服务状态失败' })
    }
  }

  // 控制服务
  const controlService = async (action: string) => {
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/xhs/mcp-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        if (data.data) {
          setServiceStatus(data.data)
        }
        // 延迟刷新状态
        setTimeout(fetchServiceStatus, 2000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: `操作失败: ${error instanceof Error ? error.message : '未知错误'}` })
    } finally {
      setLoading(false)
    }
  }

  // 获取服务日志
  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/xhs/mcp-service?action=logs&lines=100')
      const data = await response.json()
      
      if (data.success) {
        setLogs(data.data.logs)
      }
    } catch (error) {
      console.error('获取日志失败:', error)
    }
  }

  // 健康检查
  const performHealthCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/xhs/mcp-service?action=health')
      const data = await response.json()
      
      if (data.success) {
        const health = data.data
        let healthMessage = '健康检查完成:\n'
        healthMessage += `- 服务状态: ${health.service.isRunning ? '✅ 运行中' : '❌ 未运行'}\n`
        healthMessage += `- MCP协议: ${health.mcp_protocol.success ? '✅ 正常' : '❌ 异常'}\n`
        healthMessage += `- 登录状态: ${health.login.isLoggedIn ? '✅ 已登录' : '❌ 未登录'}\n`
        healthMessage += `- 整体健康: ${health.overall_health ? '✅ 健康' : '❌ 异常'}`
        
        setMessage({ 
          type: health.overall_health ? 'success' : 'error', 
          text: healthMessage 
        })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '健康检查失败' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServiceStatus()
    fetchLogs()
    
    // 定期刷新状态
    const interval = setInterval(fetchServiceStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = () => {
    if (!serviceStatus) return <Badge variant="secondary">未知</Badge>
    
    if (serviceStatus.isRunning && serviceStatus.isHealthy) {
      return <Badge variant="default" className="bg-green-500">运行中</Badge>
    } else if (serviceStatus.isRunning) {
      return <Badge variant="destructive">异常</Badge>
    } else {
      return <Badge variant="secondary">已停止</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MCP服务管理</h1>
          <p className="text-muted-foreground">小红书数据抓取服务控制面板</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchServiceStatus}
            disabled={loading}
          >
            <Activity className="w-4 h-4 mr-2" />
            刷新状态
          </Button>
          <Button 
            variant="outline" 
            onClick={performHealthCheck}
            disabled={loading}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            健康检查
          </Button>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : message.type === 'success' ? 'border-green-500' : 'border-blue-500'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">服务状态</TabsTrigger>
          <TabsTrigger value="control">服务控制</TabsTrigger>
          <TabsTrigger value="logs">服务日志</TabsTrigger>
          <TabsTrigger value="setup">部署设置</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                服务状态
                {getStatusBadge()}
              </CardTitle>
              <CardDescription>
                xiaohongshu-mcp服务运行状态和基本信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {serviceStatus ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">运行状态</p>
                    <div className="flex items-center gap-2">
                      {serviceStatus.isRunning ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {serviceStatus.isRunning ? '运行中' : '已停止'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">健康状态</p>
                    <div className="flex items-center gap-2">
                      {serviceStatus.isHealthy ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {serviceStatus.isHealthy ? '健康' : '异常'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">登录状态</p>
                    <div className="flex items-center gap-2">
                      {serviceStatus.loginStatus ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {serviceStatus.loginStatus ? '已登录' : '未登录'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">进程ID</p>
                    <span className="text-sm font-mono">
                      {serviceStatus.processId || 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2" />
                  <p>正在获取服务状态...</p>
                </div>
              )}
              
              {serviceStatus?.lastError && (
                <Alert className="border-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    最近错误: {serviceStatus.lastError}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="control" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                服务控制
              </CardTitle>
              <CardDescription>
                启动、停止和重启MCP服务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  onClick={() => controlService('start')}
                  disabled={loading || serviceStatus?.isRunning}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  启动服务
                </Button>
                
                <Button 
                  onClick={() => controlService('stop')}
                  disabled={loading || !serviceStatus?.isRunning}
                  variant="destructive"
                >
                  <Square className="w-4 h-4 mr-2" />
                  停止服务
                </Button>
                
                <Button 
                  onClick={() => controlService('restart')}
                  disabled={loading}
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重启服务
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                服务日志
              </CardTitle>
              <CardDescription>
                查看MCP服务运行日志
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={fetchLogs} variant="outline" size="sm">
                  刷新日志
                </Button>
                
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div key={index} className="mb-1">
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">暂无日志数据</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                部署设置
              </CardTitle>
              <CardDescription>
                首次部署和配置MCP服务
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  如果MCP服务未安装，请按以下步骤进行部署：
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">1. 运行部署脚本</h4>
                  <code className="bg-black text-green-400 p-2 rounded block">
                    PowerShell -ExecutionPolicy Bypass -File scripts/setup-xhs-mcp.ps1
                  </code>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">2. 登录小红书账号</h4>
                  <p className="text-sm text-muted-foreground">
                    运行 xhs-mcp/login.bat 进行账号登录
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">3. 启动MCP服务</h4>
                  <p className="text-sm text-muted-foreground">
                    运行 xhs-mcp/start-mcp.bat 或使用上方的&ldquo;启动服务&rdquo;按钮
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
