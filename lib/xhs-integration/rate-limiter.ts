// 智能频率控制系统
// 实现多层级频率限制和智能延迟

import { getXHSConfig } from './config'

export interface RequestRecord {
  timestamp: number
  type: 'keyword_search' | 'profile_crawl' | 'checkin_data' | 'general'
  success: boolean
  duration: number
}

export interface RateLimiterState {
  requestHistory: RequestRecord[]
  lastRequestTime: number
  pendingRequests: number
}

class XHSRateLimiter {
  private state: RateLimiterState = {
    requestHistory: [],
    lastRequestTime: 0,
    pendingRequests: 0
  }

  private config = getXHSConfig()

  /**
   * 检查是否允许发起请求
   */
  async checkRateLimit(requestType: RequestRecord['type'] = 'general'): Promise<{
    allowed: boolean
    waitTime: number
    reason?: string
  }> {
    const now = Date.now()
    this.cleanupOldRecords(now)

    // 检查各级别限制
    const minuteCheck = this.checkMinuteLimit(now)
    if (!minuteCheck.allowed) {
      return minuteCheck
    }

    const hourCheck = this.checkHourLimit(now)
    if (!hourCheck.allowed) {
      return hourCheck
    }

    const dayCheck = this.checkDayLimit(now)
    if (!dayCheck.allowed) {
      return dayCheck
    }

    // 检查时段限制
    const timeSlotCheck = this.checkTimeSlot(requestType, now)
    if (!timeSlotCheck.allowed) {
      return timeSlotCheck
    }

    // 计算智能延迟
    const smartDelay = this.calculateSmartDelay(now)

    return {
      allowed: true,
      waitTime: smartDelay
    }
  }

  /**
   * 执行带频率控制的请求
   */
  async executeWithRateLimit<T>(
    requestFn: () => Promise<T>,
    requestType: RequestRecord['type'] = 'general'
  ): Promise<T> {
    const rateCheck = await this.checkRateLimit(requestType)

    if (!rateCheck.allowed) {
      throw new Error(`Rate limit exceeded: ${rateCheck.reason}. Wait ${Math.ceil(rateCheck.waitTime / 1000)} seconds.`)
    }

    if (rateCheck.waitTime > 0) {
      console.log(`⏳ 智能延迟 ${rateCheck.waitTime}ms 以模拟人工操作...`)
      await this.sleep(rateCheck.waitTime)
    }

    const startTime = Date.now()
    this.state.pendingRequests++

    try {
      const result = await requestFn()

      // 记录成功请求
      this.recordRequest({
        timestamp: startTime,
        type: requestType,
        success: true,
        duration: Date.now() - startTime
      })

      return result
    } catch (error) {
      // 记录失败请求
      this.recordRequest({
        timestamp: startTime,
        type: requestType,
        success: false,
        duration: Date.now() - startTime
      })

      throw error
    } finally {
      this.state.pendingRequests--
    }
  }

  /**
   * 记录请求
   */
  private recordRequest(record: RequestRecord): void {
    this.state.requestHistory.push(record)
    this.state.lastRequestTime = record.timestamp

    // 只保留最近24小时的记录
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    this.state.requestHistory = this.state.requestHistory.filter(
      r => r.timestamp > oneDayAgo
    )
  }

  /**
   * 清理过期记录
   */
  private cleanupOldRecords(now: number): void {
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    this.state.requestHistory = this.state.requestHistory.filter(
      r => r.timestamp > oneDayAgo
    )
  }

  /**
   * 检查分钟级限制
   */
  private checkMinuteLimit(now: number): { allowed: boolean; waitTime: number; reason?: string } {
    const oneMinuteAgo = now - 60 * 1000
    const recentRequests = this.state.requestHistory.filter(r => r.timestamp > oneMinuteAgo)

    if (recentRequests.length >= this.config.rateLimit.requestsPerMinute) {
      const oldestRequest = recentRequests[0]
      const waitTime = oldestRequest.timestamp + 60 * 1000 - now + 1000 // 加1秒缓冲

      return {
        allowed: false,
        waitTime: Math.max(0, waitTime),
        reason: `分钟级限制：${recentRequests.length}/${this.config.rateLimit.requestsPerMinute}`
      }
    }

    return { allowed: true, waitTime: 0 }
  }

  /**
   * 检查小时级限制
   */
  private checkHourLimit(now: number): { allowed: boolean; waitTime: number; reason?: string } {
    const oneHourAgo = now - 60 * 60 * 1000
    const recentRequests = this.state.requestHistory.filter(r => r.timestamp > oneHourAgo)

    if (recentRequests.length >= this.config.rateLimit.requestsPerHour) {
      const oldestRequest = recentRequests[0]
      const waitTime = oldestRequest.timestamp + 60 * 60 * 1000 - now + 1000

      return {
        allowed: false,
        waitTime: Math.max(0, waitTime),
        reason: `小时级限制：${recentRequests.length}/${this.config.rateLimit.requestsPerHour}`
      }
    }

    return { allowed: true, waitTime: 0 }
  }

  /**
   * 检查天级限制
   */
  private checkDayLimit(now: number): { allowed: boolean; waitTime: number; reason?: string } {
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    const recentRequests = this.state.requestHistory.filter(r => r.timestamp > oneDayAgo)

    if (recentRequests.length >= this.config.rateLimit.requestsPerDay) {
      const oldestRequest = recentRequests[0]
      const waitTime = oldestRequest.timestamp + 24 * 60 * 60 * 1000 - now + 1000

      return {
        allowed: false,
        waitTime: Math.max(0, waitTime),
        reason: `天级限制：${recentRequests.length}/${this.config.rateLimit.requestsPerDay}`
      }
    }

    return { allowed: true, waitTime: 0 }
  }

  /**
   * 检查时段限制
   */
  private checkTimeSlot(requestType: RequestRecord['type'], now: number): {
    allowed: boolean
    waitTime: number
    reason?: string
  } {
    const currentTime = new Date(now)
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

    let allowedSlots: string[] = []

    switch (requestType) {
      case 'keyword_search':
        allowedSlots = this.config.timeSlots.keywordSearch
        break
      case 'profile_crawl':
        allowedSlots = this.config.timeSlots.profileCrawl
        break
      case 'checkin_data':
        allowedSlots = this.config.timeSlots.checkinDataUpdate
        break
      default:
        // 通用请求允许在所有时段
        return { allowed: true, waitTime: 0 }
    }

    const isAllowed = allowedSlots.some(slot => {
      const [start, end] = slot.split('-')
      return this.isTimeInRange(currentTimeStr, start, end)
    })

    if (!isAllowed) {
      // 计算到下一个允许时段的等待时间
      const nextSlotTime = this.getNextAllowedTime(allowedSlots, currentTime)
      const waitTime = nextSlotTime.getTime() - now

      return {
        allowed: false,
        waitTime: Math.max(0, waitTime),
        reason: `时段限制：${requestType}类型请求仅允许在 ${allowedSlots.join(', ')} 时段`
      }
    }

    return { allowed: true, waitTime: 0 }
  }

  /**
   * 计算智能延迟
   */
  private calculateSmartDelay(now: number): number {
    const timeSinceLastRequest = now - this.state.lastRequestTime
    const [minDelay, maxDelay] = this.config.rateLimit.randomDelayRange

    // 如果距离上次请求时间过短，增加延迟
    const baseDelay = Math.max(0, minDelay - timeSinceLastRequest)

    // 添加随机延迟模拟人工操作
    const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay

    return Math.max(baseDelay, randomDelay)
  }

  /**
   * 检查时间是否在范围内
   */
  private isTimeInRange(current: string, start: string, end: string): boolean {
    const [currentH, currentM] = current.split(':').map(Number)
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)

    const currentMinutes = currentH * 60 + currentM
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (endMinutes > startMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes
    } else {
      // 跨天情况
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }
  }

  /**
   * 获取下一个允许的时间
   */
  private getNextAllowedTime(allowedSlots: string[], currentTime: Date): Date {
    const nextDay = new Date(currentTime)
    nextDay.setDate(nextDay.getDate() + 1)
    nextDay.setHours(0, 0, 0, 0)

    // 检查今天剩余时间的时段
    for (const slot of allowedSlots) {
      const [start] = slot.split('-')
      const [startH, startM] = start.split(':').map(Number)

      const slotTime = new Date(currentTime)
      slotTime.setHours(startH, startM, 0, 0)

      if (slotTime > currentTime) {
        return slotTime
      }
    }

    // 如果今天没有可用时段，返回明天第一个时段
    const firstSlot = allowedSlots[0]
    const [start] = firstSlot.split('-')
    const [startH, startM] = start.split(':').map(Number)

    nextDay.setHours(startH, startM, 0, 0)
    return nextDay
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取当前状态
   */
  getStats(): {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    requestsInLastHour: number
    requestsInLastDay: number
    pendingRequests: number
  } {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    const successful = this.state.requestHistory.filter(r => r.success)
    const failed = this.state.requestHistory.filter(r => !r.success)
    const lastHour = this.state.requestHistory.filter(r => r.timestamp > oneHourAgo)
    const lastDay = this.state.requestHistory.filter(r => r.timestamp > oneDayAgo)

    const avgResponseTime = this.state.requestHistory.length > 0
      ? this.state.requestHistory.reduce((sum, r) => sum + r.duration, 0) / this.state.requestHistory.length
      : 0

    return {
      totalRequests: this.state.requestHistory.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      averageResponseTime: Math.round(avgResponseTime),
      requestsInLastHour: lastHour.length,
      requestsInLastDay: lastDay.length,
      pendingRequests: this.state.pendingRequests
    }
  }
}

// 全局单例
export const xhsRateLimiter = new XHSRateLimiter()

// 导出类以支持测试
export { XHSRateLimiter }