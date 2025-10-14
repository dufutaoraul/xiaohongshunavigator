// MCP服务管理器 - 处理服务启动、健康检查和自动恢复
import { spawn, ChildProcess } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

export interface MCPServiceStatus {
  isRunning: boolean
  isHealthy: boolean
  loginStatus: boolean
  version?: string
  uptime?: number
  lastError?: string
  processId?: number
}

export class MCPServiceManager {
  private mcpProcess: ChildProcess | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null
  private readonly servicePath: string
  private readonly configPath: string

  constructor() {
    this.servicePath = 'D:\\CursorWork\\xiaohongshu-mcp-windows-amd64'
    this.configPath = path.join(this.servicePath, 'config.yaml')
  }

  /**
   * 启动MCP服务
   */
  async startService(): Promise<{ success: boolean; message: string }> {
    try {
      // 检查服务是否已运行
      const status = await this.getServiceStatus()
      if (status.isRunning) {
        return { success: true, message: 'MCP服务已在运行中' }
      }

      // 检查服务文件是否存在
      const executablePath = path.join(this.servicePath, 'xiaohongshu-mcp-windows-amd64.exe')
      try {
        await fs.access(executablePath)
      } catch {
        return {
          success: false,
          message: 'MCP服务程序不存在，请先运行部署脚本'
        }
      }

      // 启动服务进程
      this.mcpProcess = spawn(executablePath, ['-headless=true'], {
        cwd: this.servicePath,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      })

      // 监听进程输出
      this.mcpProcess.stdout?.on('data', (data) => {
        console.log(`[MCP服务] ${data.toString()}`)
      })

      this.mcpProcess.stderr?.on('data', (data) => {
        console.error(`[MCP服务错误] ${data.toString()}`)
      })

      this.mcpProcess.on('exit', (code) => {
        console.log(`[MCP服务] 进程退出，代码: ${code}`)
        this.mcpProcess = null
      })

      // 等待服务启动
      await this.waitForServiceReady(30000) // 30秒超时

      // 开始健康检查
      this.startHealthCheck()

      return { success: true, message: 'MCP服务启动成功' }

    } catch (error) {
      return {
        success: false,
        message: `启动MCP服务失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  /**
   * 停止MCP服务
   */
  async stopService(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
        this.healthCheckInterval = null
      }

      if (this.mcpProcess) {
        this.mcpProcess.kill('SIGTERM')
        
        // 等待进程结束
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            if (this.mcpProcess) {
              this.mcpProcess.kill('SIGKILL')
            }
            resolve()
          }, 5000)

          this.mcpProcess?.on('exit', () => {
            clearTimeout(timeout)
            resolve()
          })
        })

        this.mcpProcess = null
      }

      return { success: true, message: 'MCP服务已停止' }

    } catch (error) {
      return {
        success: false,
        message: `停止MCP服务失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  /**
   * 重启MCP服务
   */
  async restartService(): Promise<{ success: boolean; message: string }> {
    const stopResult = await this.stopService()
    if (!stopResult.success) {
      return stopResult
    }

    // 等待一秒后重启
    await new Promise(resolve => setTimeout(resolve, 1000))

    return await this.startService()
  }

  /**
   * 获取服务状态
   */
  async getServiceStatus(): Promise<MCPServiceStatus> {
    try {
      // 首先检查端口是否开放
      const isPortOpen = await this.checkPort(18060)
      if (!isPortOpen) {
        return {
          isRunning: false,
          isHealthy: false,
          loginStatus: false,
          lastError: '端口18060未开放，服务可能未启动'
        }
      }

      // 尝试多个端点检查服务状态
      const endpoints = ['/health', '/api/v1/health', '/status', '/']

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)

          const response = await fetch(`http://localhost:18060${endpoint}`, {
            method: 'GET',
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            let data = {}
            try {
              data = await response.json()
            } catch {
              // 如果不是JSON响应，也认为服务是健康的
            }

            return {
              isRunning: true,
              isHealthy: true,
              loginStatus: (data as any).loginStatus || false,
              version: (data as any).version || 'unknown',
              uptime: (data as any).uptime,
              processId: this.mcpProcess?.pid
            }
          }
        } catch {
          continue // 尝试下一个端点
        }
      }

      // 如果所有端点都失败，但端口开放，认为服务运行但不健康
      return {
        isRunning: true,
        isHealthy: false,
        loginStatus: false,
        lastError: '服务运行但健康检查失败'
      }

    } catch (error) {
      return {
        isRunning: false,
        isHealthy: false,
        loginStatus: false,
        lastError: error instanceof Error ? error.message : '连接失败'
      }
    }
  }

  /**
   * 测试MCP协议连接
   */
  async testMCPConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('http://localhost:18060/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {},
          id: 1
        }),
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          message: `MCP协议连接成功，支持 ${data.result?.capabilities ? Object.keys(data.result.capabilities).length : 0} 个功能`
        }
      }

      return {
        success: false,
        message: `MCP协议测试失败: HTTP ${response.status}`
      }

    } catch (error) {
      return {
        success: false,
        message: `MCP协议连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  /**
   * 检查登录状态
   */
  async checkLoginStatus(): Promise<{ isLoggedIn: boolean; message: string }> {
    try {
      // 使用直接的HTTP API端点检查登录状态
      const response = await fetch('http://localhost:18060/api/v1/login/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const data = await response.json()

        if (!data.success) {
          return {
            isLoggedIn: false,
            message: data.message || '检查登录状态失败'
          }
        }

        const isLoggedIn = data.data?.is_logged_in || false
        const username = data.data?.username || 'unknown'

        return {
          isLoggedIn,
          message: isLoggedIn
            ? `已登录小红书账号 (${username})`
            : '未登录，请先运行登录工具'
        }
      }

      return {
        isLoggedIn: false,
        message: `HTTP请求失败: ${response.status} ${response.statusText}`
      }

    } catch (error) {
      return {
        isLoggedIn: false,
        message: `检查登录状态失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  /**
   * 等待服务就绪
   */
  private async waitForServiceReady(timeout: number): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch('http://localhost:18060/health', {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        })
        
        if (response.ok) {
          return // 服务就绪
        }
      } catch {
        // 继续等待
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    throw new Error('服务启动超时')
  }

  /**
   * 开始健康检查
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      const status = await this.getServiceStatus()
      
      if (!status.isRunning || !status.isHealthy) {
        console.warn('[MCP服务管理器] 检测到服务异常，尝试重启...')
        
        const restartResult = await this.restartService()
        if (restartResult.success) {
          console.log('[MCP服务管理器] 服务重启成功')
        } else {
          console.error('[MCP服务管理器] 服务重启失败:', restartResult.message)
        }
      }
    }, 60000) // 每分钟检查一次
  }

  /**
   * 检查端口是否开放
   */
  private async checkPort(port: number): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)

      const response = await fetch(`http://localhost:${port}`, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return true // 如果能连接到端口，认为端口是开放的
    } catch {
      return false // 连接失败，端口未开放
    }
  }

  /**
   * 获取服务日志
   */
  async getServiceLogs(lines: number = 100): Promise<string[]> {
    try {
      const logPath = path.join(this.servicePath, 'logs', 'service.log')
      const content = await fs.readFile(logPath, 'utf-8')
      const allLines = content.split('\n')
      return allLines.slice(-lines).filter(line => line.trim())
    } catch {
      return ['日志文件不存在或无法读取']
    }
  }
}

// 全局单例
export const mcpServiceManager = new MCPServiceManager()
