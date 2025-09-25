// 小红书数据抓取配置文件
// 风控策略和安全参数设置

export interface XHSIntegrationConfig {
  // 抓取频率控制
  rateLimit: {
    // 每分钟最大请求数
    requestsPerMinute: number
    // 每小时最大请求数
    requestsPerHour: number
    // 每天最大请求数
    requestsPerDay: number
    // 请求间隔随机化范围 (毫秒)
    randomDelayRange: [number, number]
  }

  // 分时段控制
  timeSlots: {
    // 关键词搜索时段 (学员活跃时间)
    keywordSearch: string[]
    // 主页数据抓取时段
    profileCrawl: string[]
    // 打卡数据更新时段 (夜间低峰)
    checkinDataUpdate: string[]
  }

  // 缓存策略
  cache: {
    // 帖子数据缓存时长 (小时)
    postDataTTL: number
    // 用户主页数据缓存时长 (小时)
    profileDataTTL: number
    // 搜索结果缓存时长 (小时)
    searchResultTTL: number
  }

  // 风控监控
  riskMonitoring: {
    // 连续失败次数阈值
    maxConsecutiveFailures: number
    // 触发风控后的等待时间 (毫秒)
    cooldownPeriod: number
    // 风控检测关键词
    riskKeywords: string[]
  }
}

// 默认配置 - 保守策略
export const DEFAULT_XHS_CONFIG: XHSIntegrationConfig = {
  rateLimit: {
    requestsPerMinute: 2,      // 非常保守：每分钟2个请求
    requestsPerHour: 30,       // 每小时30个请求
    requestsPerDay: 200,       // 每天200个请求 (远低于xiaohongshu-mcp的50帖子限制)
    randomDelayRange: [3000, 8000] // 3-8秒随机延迟
  },

  timeSlots: {
    keywordSearch: ['09:00-11:00', '14:00-16:00', '19:00-21:00'],
    profileCrawl: ['14:00-16:00', '20:00-22:00'],
    checkinDataUpdate: ['22:00-24:00', '02:00-04:00']
  },

  cache: {
    postDataTTL: 168,      // 7天缓存
    profileDataTTL: 72,    // 3天缓存
    searchResultTTL: 24    // 1天缓存
  },

  riskMonitoring: {
    maxConsecutiveFailures: 3,
    cooldownPeriod: 1800000, // 30分钟冷却
    riskKeywords: [
      '验证码', '安全验证', '请稍后再试',
      '访问频率过快', '异常访问', '账号异常'
    ]
  }
}

// 环境配置
export const XHS_INTEGRATION_ENV = {
  // 开发环境：更严格的限制
  development: {
    ...DEFAULT_XHS_CONFIG,
    rateLimit: {
      ...DEFAULT_XHS_CONFIG.rateLimit,
      requestsPerMinute: 1,
      requestsPerHour: 20,
      requestsPerDay: 100
    }
  },

  // 生产环境：使用默认配置
  production: DEFAULT_XHS_CONFIG,

  // 测试环境：最严格限制
  test: {
    ...DEFAULT_XHS_CONFIG,
    rateLimit: {
      ...DEFAULT_XHS_CONFIG.rateLimit,
      requestsPerMinute: 1,
      requestsPerHour: 10,
      requestsPerDay: 50
    }
  }
}

// 获取当前环境配置
export function getXHSConfig(): XHSIntegrationConfig {
  const env = process.env.NODE_ENV || 'development'
  return XHS_INTEGRATION_ENV[env as keyof typeof XHS_INTEGRATION_ENV] || XHS_INTEGRATION_ENV.development
}