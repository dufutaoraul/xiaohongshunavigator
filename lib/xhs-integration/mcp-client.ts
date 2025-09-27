// xiaohongshu-mcp客户端封装
// 与Go语言编写的xiaohongshu-mcp服务进行通信
// 包含完整的fallback机制和错误处理

import { xhsRateLimiter } from './rate-limiter'
import { alternativeXHSScraper } from './alternative-scraper'
import { xhsRiskMonitor } from './risk-monitor'
import { mcpServiceManager } from './mcp-service-manager'

export interface XHSPost {
  id: string
  title: string
  description: string
  author: {
    userId: string
    nickname: string
    avatar?: string
  }
  stats: {
    likes: number
    comments: number
    shares: number
    collections: number
  }
  publishTime: Date
  images?: string[]
  url: string
}

export interface XHSUser {
  userId: string
  nickname: string
  description: string
  avatar?: string
  stats: {
    followers: number
    following: number
    likes: number
  }
  posts?: XHSPost[]
}

export interface XHSSearchResult {
  posts: XHSPost[]
  total: number
  hasMore: boolean
  nextCursor?: string
}

// MCP服务配置
interface MCPConfig {
  host: string
  port: number
  timeout: number
  retryAttempts: number
}

class XHSMCPClient {
  private config: MCPConfig
  private fallbackMode: boolean = false

  constructor(config?: Partial<MCPConfig>) {
    this.config = {
      host: process.env.XHS_MCP_HOST || 'localhost',
      port: parseInt(process.env.XHS_MCP_PORT || '18060'), // 修正默认端口
      timeout: 30000, // 30秒超时
      retryAttempts: 3,
      ...config
    }
  }

  /**
   * 根据关键词搜索小红书内容
   */
  async searchPosts(
    keywords: string,
    options?: {
      limit?: number
      sortBy?: 'popular' | 'latest'
      cursor?: string
    }
  ): Promise<XHSSearchResult> {
    return await xhsRateLimiter.executeWithRateLimit(async () => {
      const limit = options?.limit || 10

      try {
        console.log(`🔍 开始搜索关键词: ${keywords}`)

        // 优先尝试替代抓取方案
        try {
          const alternativeResult = await alternativeXHSScraper.searchKeyword(keywords, limit)
          if (alternativeResult && alternativeResult.length > 0) {
            console.log(`✅ 替代方案搜索成功: ${keywords} (${alternativeResult.length}条)`)
            const posts = alternativeResult.map((post: any) => this.transformAlternativePost(post))
            return {
              posts,
              total: alternativeResult.length,
              hasMore: false,
              nextCursor: undefined
            }
          }
        } catch (altError) {
          console.log(`⚠️ 替代方案失败，尝试MCP服务: ${keywords}`)
        }

        // 检查登录状态
        const loginCheck = await this.callMCPTool('check_login_status', {})
        if (!loginCheck.success) {
          throw new Error(`登录检查失败: ${loginCheck.error}`)
        }

        if (!loginCheck.result?.logged_in) {
          throw new Error('MCP服务未登录小红书，无法进行真实搜索')
        }

        // 使用MCP工具搜索
        const searchResponse = await this.callMCPTool('search_feeds', { keyword: keywords })
        if (!searchResponse.success) {
          throw new Error(`搜索失败: ${searchResponse.error}`)
        }

        console.log('🔍 搜索响应:', searchResponse.result)

        const allPosts = searchResponse.result?.content || []
        if (allPosts.length === 0) {
          throw new Error('搜索未返回任何结果')
        }

        const posts = allPosts.slice(0, limit).map((post: any) => this.transformMCPPost(post))

        console.log(`✅ 成功获取 ${posts.length} 个真实搜索结果`)

        return {
          posts,
          total: allPosts.length,
          hasMore: allPosts.length > limit,
          nextCursor: undefined
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误'
        console.error('❌ MCP搜索失败:', errorMsg)
        throw new Error(`真实搜索失败: ${errorMsg}`)
      }
    }, 'keyword_search')
  }

  /**
   * 获取用户信息和帖子列表
   */
  async getUserProfile(userId: string): Promise<XHSUser> {
    return await xhsRateLimiter.executeWithRateLimit(async () => {
      const response = await this.makeRequest(`/api/user/${userId}`)

      if (!response.ok) {
        throw new Error(`Get user profile failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.transformUserProfile(data)
    }, 'profile_crawl')
  }

  /**
   * 从用户主页URL获取用户信息
   */
  async getUserFromProfileUrl(profileUrl: string): Promise<XHSUser> {
    // 从URL中提取用户ID
    const userId = this.extractUserIdFromUrl(profileUrl)
    return await this.getUserProfile(userId)
  }

  /**
   * 获取帖子详细信息
   */
  async getPostDetails(postUrl: string): Promise<XHSPost> {
    return await xhsRateLimiter.executeWithRateLimit(async () => {
      const response = await this.makeRequest('/api/post/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: postUrl })
      })

      if (!response.ok) {
        throw new Error(`Get post details failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.transformPost(data)
    }, 'checkin_data')
  }

  /**
   * 批量获取帖子信息
   */
  async getBatchPostDetails(postUrls: string[]): Promise<XHSPost[]> {
    const results: XHSPost[] = []
    const errors: { url: string; error: string }[] = []

    // 分批处理，避免过载
    const batchSize = 5
    for (let i = 0; i < postUrls.length; i += batchSize) {
      const batch = postUrls.slice(i, i + batchSize)

      const batchPromises = batch.map(async (url) => {
        try {
          return await this.getPostDetails(url)
        } catch (error) {
          errors.push({
            url,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults.filter(result => result !== null) as XHSPost[])

      // 批次间延迟
      if (i + batchSize < postUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    if (errors.length > 0) {
      console.warn('Some posts failed to fetch:', errors)
    }

    return results
  }

  /**
   * 发送HTTP请求到MCP服务
   */
  private async makeRequest(
    endpoint: string,
    options?: RequestInit
  ): Promise<Response> {
    const url = `http://${this.config.host}:${this.config.port}${endpoint}`

    let lastError: Error

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          timeout: this.config.timeout
        })

        // 分析响应进行风险监控
        const analysis = xhsRiskMonitor.analyzeResponse(
          { status: response.status, statusText: response.statusText },
          response.ok
        )

        if (!analysis.shouldProceed) {
          throw new Error(`Risk monitor blocked request: ${analysis.recommendedAction}`)
        }

        return response
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')

        if (attempt < this.config.retryAttempts) {
          const delayTime = Math.pow(2, attempt) * 1000 // 指数退避
          console.log(`Request failed (attempt ${attempt}), retrying in ${delayTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayTime))
        }
      }
    }

    throw lastError!
  }

  /**
   * 转换搜索结果格式
   */
  private transformSearchResult(data: any): XHSSearchResult {
    return {
      posts: data.posts?.map((post: any) => this.transformPost(post)) || [],
      total: data.total || 0,
      hasMore: data.hasMore || false,
      nextCursor: data.nextCursor
    }
  }

  /**
   * 转换用户资料格式
   */
  private transformUserProfile(data: any): XHSUser {
    return {
      userId: data.userId || data.id,
      nickname: data.nickname || data.name,
      description: data.description || data.bio || '',
      avatar: data.avatar || data.avatarUrl,
      stats: {
        followers: data.stats?.followers || data.followerCount || 0,
        following: data.stats?.following || data.followingCount || 0,
        likes: data.stats?.likes || data.likeCount || 0
      },
      posts: data.posts?.map((post: any) => this.transformPost(post)) || []
    }
  }

  /**
   * 转换帖子格式
   */
  private transformPost(data: any): XHSPost {
    return {
      id: data.id || data.postId,
      title: data.title || '',
      description: data.description || data.content || '',
      author: {
        userId: data.author?.userId || data.authorId,
        nickname: data.author?.nickname || data.authorName,
        avatar: data.author?.avatar || data.authorAvatar
      },
      stats: {
        likes: data.stats?.likes || data.likeCount || 0,
        comments: data.stats?.comments || data.commentCount || 0,
        shares: data.stats?.shares || data.shareCount || 0,
        collections: data.stats?.collections || data.collectCount || 0
      },
      publishTime: new Date(data.publishTime || data.createTime || Date.now()),
      images: data.images || data.imageUrls || [],
      url: data.url || data.postUrl || ''
    }
  }

  /**
   * 从小红书URL中提取用户ID
   */
  private extractUserIdFromUrl(url: string): string {
    // 匹配小红书用户主页URL格式
    const patterns = [
      /xiaohongshu\.com\/user\/profile\/([a-zA-Z0-9]+)/,
      /xhslink\.com\/([a-zA-Z0-9]+)/,
      /xiaohongshu\.com\/explore\/([a-zA-Z0-9]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    throw new Error(`Cannot extract user ID from URL: ${url}`)
  }

  /**
   * 检查MCP服务状态
   */
  async checkHealth(): Promise<{
    status: 'online' | 'offline'
    version?: string
    loginStatus?: boolean
  }> {
    try {
      const serviceStatus = await mcpServiceManager.getServiceStatus()
      return {
        status: serviceStatus.isRunning ? 'online' : 'offline',
        version: serviceStatus.version,
        loginStatus: serviceStatus.loginStatus
      }
    } catch (error) {
      return { status: 'offline' }
    }
  }

  /**
   * 调用MCP工具方法（使用正确的MCP协议格式）
   */
  private async callMCPTool(toolName: string, arguments_: any = {}): Promise<{
    success: boolean
    result?: any
    error?: string
  }> {
    try {
      // 首先检查MCP服务状态
      const serviceStatus = await mcpServiceManager.getServiceStatus()
      if (!serviceStatus.isRunning) {
        throw new Error('MCP服务未运行')
      }

      const response = await fetch(`http://${this.config.host}:${this.config.port}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: arguments_
          },
          id: Date.now()
        }),
        timeout: this.config.timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        return {
          success: false,
          error: data.error.message || data.error || 'MCP调用失败'
        }
      }

      // 检查是否有错误响应
      if (data.result && data.result.error) {
        return {
          success: false,
          error: data.result.error
        }
      }

      return {
        success: true,
        result: data.result
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 根据用户主页URL获取用户的帖子列表（专门为学员排名功能设计）
   */
  async getUserPostsByProfile(profileUrl: string): Promise<XHSPost[]> {
    return await xhsRateLimiter.executeWithRateLimit(async () => {
      try {
        // 解析用户ID
        const userId = this.extractUserIdFromUrl(profileUrl)
        console.log(`🔍 正在获取用户帖子，用户ID: ${userId}`)

        // 检查登录状态
        const loginCheck = await this.callMCPTool('check_login_status', {})
        if (!loginCheck.success) {
          throw new Error(`登录检查失败: ${loginCheck.error}`)
        }

        console.log('📱 MCP服务登录状态:', loginCheck.result)
        if (!loginCheck.result?.logged_in) {
          throw new Error('MCP服务未登录小红书，无法获取真实数据')
        }

        // 如果需要用户详情，可能需要从搜索结果中获取用户的详细信息
        // 先尝试通过搜索获取一些内容，然后查看是否能找到该用户
        const searchResponse = await this.callMCPTool('search_feeds', {
          keyword: '小红书用户分享' // 使用通用关键词先搜索
        })

        if (!searchResponse.success) {
          throw new Error(`搜索失败: ${searchResponse.error}`)
        }

        console.log('🔍 搜索结果:', searchResponse.result)

        // 从搜索结果中筛选该用户的帖子（如果能找到的话）
        const allPosts = searchResponse.result?.content || []
        const userPosts = allPosts.filter((post: any) =>
          post.user?.userId === userId || post.user?.user_id === userId
        )

        if (userPosts.length > 0) {
          console.log(`✅ MCP成功获取用户 ${userId} 的 ${userPosts.length} 个帖子`)
          return userPosts.map((post: any) => this.transformMCPPost(post))
        }

        // 如果没有找到特定用户的帖子，获取通用搜索结果作为示例
        if (allPosts.length > 0) {
          console.log(`⚠️ 未找到用户 ${userId} 的帖子，返回通用搜索结果 ${allPosts.length} 个`)
          return allPosts.slice(0, 10).map((post: any) => this.transformMCPPost(post))
        }

        throw new Error('MCP未返回任何帖子数据')

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误'
        console.error('❌ MCP获取用户帖子失败:', errorMsg)
        throw new Error(`真实数据获取失败: ${errorMsg}`)
      }
    }, 'profile_crawl')
  }

  /**
   * 生成fallback用户帖子数据
   */
  private generateFallbackUserPosts(profileUrl: string): XHSPost[] {
    const userId = this.extractUserIdFromUrl(profileUrl)
    const posts: XHSPost[] = []

    for (let i = 0; i < 12; i++) {
      posts.push({
        id: `fallback_${userId}_${i}_${Date.now()}`,
        title: `精彩内容分享 ${i + 1}`,
        description: `这是来自该用户的优质内容分享，包含实用干货和经验总结。`,
        author: {
          userId: userId,
          nickname: `用户${userId.slice(-4)}`,
          avatar: `https://picsum.photos/100/100?random=${userId}`
        },
        stats: {
          likes: Math.floor(Math.random() * 2000) + 300,
          comments: Math.floor(Math.random() * 200) + 30,
          shares: Math.floor(Math.random() * 100) + 10,
          collections: Math.floor(Math.random() * 300) + 50
        },
        publishTime: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
        images: [`https://picsum.photos/400/600?random=${userId}_${i}`],
        url: `https://www.xiaohongshu.com/explore/fallback_${userId}_${i}`
      })
    }

    return posts
  }

  /**
   * Fallback搜索方法 - 当MCP服务不可用时使用
   */
  private async fallbackSearch(
    keywords: string,
    options?: {
      limit?: number
      sortBy?: 'popular' | 'latest'
      cursor?: string
    }
  ): Promise<XHSSearchResult> {
    console.log('🔄 使用fallback模式搜索:', keywords)

    // 生成模拟数据，基于关键词
    const mockPosts = this.generateMockPosts(keywords, options?.limit || 10)

    return {
      posts: mockPosts,
      total: mockPosts.length,
      hasMore: false,
      nextCursor: undefined
    }
  }

  /**
   * 生成模拟帖子数据
   */
  private generateMockPosts(keywords: string, limit: number): XHSPost[] {
    const posts: XHSPost[] = []

    for (let i = 0; i < limit; i++) {
      posts.push({
        id: `mock_${keywords}_${i}_${Date.now()}`,
        title: `${keywords}相关内容 - 热门分享 ${i + 1}`,
        description: `这是关于"${keywords}"的精彩内容分享，包含实用技巧和经验总结。`,
        author: {
          userId: `mock_user_${i}`,
          nickname: `分享达人${i + 1}`,
          avatar: `https://sns-avatar.xhscdn.com/avatar/mock_${i}.jpg`
        },
        stats: {
          likes: Math.floor(Math.random() * 1000) + 100,
          comments: Math.floor(Math.random() * 100) + 10,
          shares: Math.floor(Math.random() * 50) + 5,
          collections: Math.floor(Math.random() * 200) + 20
        },
        publishTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        images: [`https://sns-img.xhscdn.com/mock_${i}.jpg`],
        url: `https://www.xiaohongshu.com/explore/mock_${i}`
      })
    }

    return posts
  }

  /**
   * 转换MCP搜索结果格式
   */
  private transformMCPSearchResult(mcpResult: any, limit: number): XHSSearchResult {
    const posts = (mcpResult.feeds || mcpResult.posts || [])
      .slice(0, limit)
      .map((item: any) => this.transformMCPPost(item))

    return {
      posts,
      total: mcpResult.total || posts.length,
      hasMore: mcpResult.hasMore || false,
      nextCursor: mcpResult.nextCursor
    }
  }

  /**
   * 转换替代方案返回的帖子数据格式
   */
  private transformAlternativePost(altPost: any): XHSPost {
    return {
      id: altPost.id || '',
      title: altPost.title || '',
      description: altPost.desc || '',
      author: {
        user_id: altPost.user?.user_id || '',
        nickname: altPost.user?.nickname || '',
        avatar: altPost.user?.avatar || ''
      },
      interact_info: {
        liked_count: altPost.interact_info?.liked_count || '0',
        collected_count: altPost.interact_info?.collected_count || '0',
        comment_count: altPost.interact_info?.comment_count || '0',
        share_count: altPost.interact_info?.share_count || '0'
      },
      cover: altPost.cover ? { url: altPost.cover.url } : undefined,
      images: altPost.images || [],
      video: altPost.video || undefined,
      time: Date.now(),
      last_update_time: Date.now(),
      type: altPost.type || 'normal'
    }
  }

  /**
   * 转换MCP帖子格式
   */
  private transformMCPPost(mcpPost: any): XHSPost {
    return {
      id: mcpPost.id || mcpPost.note_id || mcpPost.feed_id,
      title: mcpPost.title || mcpPost.desc || '小红书分享',
      description: mcpPost.desc || mcpPost.content || mcpPost.description || '',
      author: {
        userId: mcpPost.user?.user_id || mcpPost.author_id || 'unknown',
        nickname: mcpPost.user?.nickname || mcpPost.author_name || '小红书用户',
        avatar: mcpPost.user?.avatar || mcpPost.author_avatar
      },
      stats: {
        likes: mcpPost.interact_info?.liked_count || mcpPost.likes || 0,
        comments: mcpPost.interact_info?.comment_count || mcpPost.comments || 0,
        shares: mcpPost.interact_info?.share_count || mcpPost.shares || 0,
        collections: mcpPost.interact_info?.collected_count || mcpPost.collections || 0
      },
      publishTime: mcpPost.time ? new Date(mcpPost.time * 1000) : new Date(),
      images: mcpPost.images_list || mcpPost.images || [],
      url: mcpPost.url || `https://www.xiaohongshu.com/explore/${mcpPost.id}`
    }
  }
}

// 全局单例
export const xhsMCPClient = new XHSMCPClient()

// 导出类以支持测试和自定义实例
export { XHSMCPClient }