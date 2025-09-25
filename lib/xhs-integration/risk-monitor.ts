// 小红书风控监控系统
// 实时监测风险信号并自动执行保护措施

import { getXHSConfig } from './config'

export interface RiskSignal {
  type: 'rate_limit' | 'captcha' | 'login_required' | 'suspicious_activity' | 'unknown_error'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
  responseData?: any
}

export interface RiskMonitorState {
  consecutiveFailures: number
  lastFailureTime: Date | null
  isCooldownActive: boolean
  cooldownUntil: Date | null
  totalRequests: number
  totalFailures: number
  riskSignals: RiskSignal[]
}

class XHSRiskMonitor {
  private state: RiskMonitorState = {
    consecutiveFailures: 0,
    lastFailureTime: null,
    isCooldownActive: false,
    cooldownUntil: null,
    totalRequests: 0,
    totalFailures: 0,
    riskSignals: []
  }

  private config = getXHSConfig()

  /**
   * 检测响应是否包含风险信号
   */
  detectRiskSignals(response: any): RiskSignal[] {
    const signals: RiskSignal[] = []
    const responseText = JSON.stringify(response).toLowerCase()

    // 检测验证码
    if (this.containsKeywords(responseText, ['验证码', 'captcha', '安全验证'])) {
      signals.push({
        type: 'captcha',
        severity: 'critical',
        message: '检测到验证码要求',
        timestamp: new Date(),
        responseData: response
      })
    }

    // 检测频率限制
    if (this.containsKeywords(responseText, ['请稍后再试', '访问频率过快', 'too many requests'])) {
      signals.push({
        type: 'rate_limit',
        severity: 'high',
        message: '检测到频率限制',
        timestamp: new Date(),
        responseData: response
      })
    }

    // 检测登录状态
    if (this.containsKeywords(responseText, ['请登录', 'login required', '未登录'])) {
      signals.push({
        type: 'login_required',
        severity: 'high',
        message: '检测到需要重新登录',
        timestamp: new Date(),
        responseData: response
      })
    }

    // 检测可疑活动
    if (this.containsKeywords(responseText, ['账号异常', '异常访问', 'suspicious activity'])) {
      signals.push({
        type: 'suspicious_activity',
        severity: 'critical',
        message: '检测到可疑活动警告',
        timestamp: new Date(),
        responseData: response
      })
    }

    // HTTP状态码检测
    if (response.status) {
      if (response.status === 429) {
        signals.push({
          type: 'rate_limit',
          severity: 'high',
          message: `HTTP 429: Too Many Requests`,
          timestamp: new Date(),
          responseData: response
        })
      } else if (response.status >= 400) {
        signals.push({
          type: 'unknown_error',
          severity: 'medium',
          message: `HTTP ${response.status}: ${response.statusText || 'Unknown Error'}`,
          timestamp: new Date(),
          responseData: response
        })
      }
    }

    return signals
  }

  /**
   * 分析请求结果并更新风险状态
   */
  analyzeResponse(response: any, isSuccess: boolean): {
    shouldProceed: boolean
    riskLevel: 'safe' | 'caution' | 'danger' | 'blocked'
    recommendedAction: string
    waitTime?: number
  } {
    this.state.totalRequests++

    if (!isSuccess) {
      this.state.totalFailures++
      this.state.consecutiveFailures++
      this.state.lastFailureTime = new Date()
    } else {
      this.state.consecutiveFailures = 0
    }

    // 检测风险信号
    const riskSignals = this.detectRiskSignals(response)
    this.state.riskSignals.push(...riskSignals)

    // 保持最近100条记录
    if (this.state.riskSignals.length > 100) {
      this.state.riskSignals = this.state.riskSignals.slice(-100)
    }

    // 分析风险等级
    const highRiskSignals = riskSignals.filter(s => s.severity === 'high' || s.severity === 'critical')

    if (highRiskSignals.length > 0) {
      return this.handleHighRisk(highRiskSignals)
    }

    if (this.state.consecutiveFailures >= this.config.riskMonitoring.maxConsecutiveFailures) {
      return this.activateCooldown()
    }

    if (this.state.isCooldownActive && new Date() < this.state.cooldownUntil!) {
      return {
        shouldProceed: false,
        riskLevel: 'blocked',
        recommendedAction: '冷却期中，暂停所有请求',
        waitTime: this.state.cooldownUntil!.getTime() - Date.now()
      }
    }

    return {
      shouldProceed: true,
      riskLevel: 'safe',
      recommendedAction: '继续正常操作'
    }
  }

  /**
   * 处理高风险情况
   */
  private handleHighRisk(signals: RiskSignal[]): {
    shouldProceed: boolean
    riskLevel: 'danger' | 'blocked'
    recommendedAction: string
    waitTime?: number
  } {
    const criticalSignals = signals.filter(s => s.severity === 'critical')

    if (criticalSignals.length > 0) {
      // 立即激活长时间冷却
      const extendedCooldown = this.config.riskMonitoring.cooldownPeriod * 4 // 2小时
      this.state.cooldownUntil = new Date(Date.now() + extendedCooldown)
      this.state.isCooldownActive = true

      return {
        shouldProceed: false,
        riskLevel: 'blocked',
        recommendedAction: '检测到严重风险，激活紧急冷却模式',
        waitTime: extendedCooldown
      }
    }

    return this.activateCooldown()
  }

  /**
   * 激活冷却模式
   */
  private activateCooldown(): {
    shouldProceed: false
    riskLevel: 'blocked'
    recommendedAction: string
    waitTime: number
  } {
    this.state.cooldownUntil = new Date(Date.now() + this.config.riskMonitoring.cooldownPeriod)
    this.state.isCooldownActive = true

    return {
      shouldProceed: false,
      riskLevel: 'blocked',
      recommendedAction: '连续失败次数过多，激活冷却模式',
      waitTime: this.config.riskMonitoring.cooldownPeriod
    }
  }

  /**
   * 检查文本是否包含关键词
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()))
  }

  /**
   * 获取当前风险状态
   */
  getStatus(): RiskMonitorState & {
    riskLevel: 'safe' | 'caution' | 'danger' | 'blocked'
    successRate: number
  } {
    let riskLevel: 'safe' | 'caution' | 'danger' | 'blocked' = 'safe'

    if (this.state.isCooldownActive) {
      riskLevel = 'blocked'
    } else if (this.state.consecutiveFailures >= this.config.riskMonitoring.maxConsecutiveFailures) {
      riskLevel = 'danger'
    } else if (this.state.consecutiveFailures >= 2) {
      riskLevel = 'caution'
    }

    const successRate = this.state.totalRequests > 0
      ? (this.state.totalRequests - this.state.totalFailures) / this.state.totalRequests
      : 1

    return {
      ...this.state,
      riskLevel,
      successRate: Math.round(successRate * 100) / 100
    }
  }

  /**
   * 重置监控状态
   */
  reset(): void {
    this.state = {
      consecutiveFailures: 0,
      lastFailureTime: null,
      isCooldownActive: false,
      cooldownUntil: null,
      totalRequests: 0,
      totalFailures: 0,
      riskSignals: []
    }
  }

  /**
   * 手动结束冷却期
   */
  endCooldown(): void {
    this.state.isCooldownActive = false
    this.state.cooldownUntil = null
    this.state.consecutiveFailures = 0
  }
}

// 全局单例
export const xhsRiskMonitor = new XHSRiskMonitor()

// 导出类以支持测试
export { XHSRiskMonitor }