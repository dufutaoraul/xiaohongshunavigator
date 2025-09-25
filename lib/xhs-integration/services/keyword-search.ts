// 关键词热门帖子搜索服务
// 实现功能3：根据学员输入的关键词搜索全网热门小红书帖子

import { xhsMCPClient, XHSPost } from '../mcp-client'
import { supabase } from '@/lib/supabase'

export interface KeywordSearchResult {
  keyword: string
  posts: XHSPost[]
  totalFound: number
  cached: boolean
  searchTime: Date
}

export interface TrendingPost extends XHSPost {
  trendingScore: number
  ranking: number
}

class KeywordSearchService {
  /**
   * 根据关键词搜索热门帖子
   */
  async searchTrendingPosts(
    keywords: string,
    options?: {
      limit?: number
      useCache?: boolean
      sortBy?: 'popular' | 'latest'
    }
  ): Promise<KeywordSearchResult> {
    const {
      limit = 10,
      useCache = true,
      sortBy = 'popular'
    } = options || {}

    const keywordHash = this.generateKeywordsHash(keywords)

    // 尝试从缓存获取结果
    if (useCache) {
      const cachedResult = await this.getCachedSearchResult(keywordHash)
      if (cachedResult) {
        console.log('🎯 使用缓存的搜索结果:', keywords)
        return cachedResult
      }
    }

    // 执行新的搜索
    console.log('🔍 执行新的关键词搜索:', keywords)
    const searchResults = await xhsMCPClient.searchPosts(keywords, {
      limit: Math.min(limit * 2, 20), // 多获取一些用于筛选
      sortBy
    })

    // 计算热度得分并排序
    const trendingPosts = this.calculateTrendingScores(searchResults.posts)
    const topPosts = trendingPosts.slice(0, limit)

    const result: KeywordSearchResult = {
      keyword: keywords,
      posts: topPosts,
      totalFound: searchResults.total,
      cached: false,
      searchTime: new Date()
    }

    // 缓存结果
    await this.cacheSearchResult(keywordHash, keywords, result)

    // 缓存帖子数据
    await this.cachePosts(topPosts)

    return result
  }

  /**
   * 批量搜索多个关键词
   */
  async batchSearchTrendingPosts(
    keywordsList: string[],
    options?: {
      limit?: number
      useCache?: boolean
    }
  ): Promise<KeywordSearchResult[]> {
    const results: KeywordSearchResult[] = []

    for (const keywords of keywordsList) {
      try {
        const result = await this.searchTrendingPosts(keywords, options)
        results.push(result)

        // 批量处理间增加延迟
        if (keywordsList.indexOf(keywords) < keywordsList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        console.error(`搜索关键词 "${keywords}" 失败:`, error)
        // 继续处理其他关键词
        results.push({
          keyword: keywords,
          posts: [],
          totalFound: 0,
          cached: false,
          searchTime: new Date()
        })
      }
    }

    return results
  }

  /**
   * 获取学员个人关键词的推荐帖子
   * 基于学员档案中的keywords字段
   */
  async getPersonalizedRecommendations(
    studentId: string,
    options?: {
      limit?: number
      useCache?: boolean
    }
  ): Promise<{
    studentInfo: any
    recommendations: KeywordSearchResult[]
  }> {
    // 获取学员信息
    const { data: studentData, error } = await supabase
      .from('users')
      .select('student_id, name, keywords, persona')
      .eq('student_id', studentId)
      .single()

    if (error || !studentData) {
      throw new Error(`找不到学员信息: ${studentId}`)
    }

    if (!studentData.keywords) {
      throw new Error('学员未设置关键词，无法生成个性化推荐')
    }

    // 解析关键词
    const keywords = studentData.keywords.split(',').map((k: string) => k.trim())

    // 批量搜索关键词
    const recommendations = await this.batchSearchTrendingPosts(keywords, options)

    return {
      studentInfo: studentData,
      recommendations
    }
  }

  /**
   * 计算帖子热度得分
   */
  private calculateTrendingScores(posts: XHSPost[]): TrendingPost[] {
    const trendingPosts = posts.map(post => {
      // 综合热度算法
      const likesWeight = 0.4
      const commentsWeight = 0.3
      const collectionsWeight = 0.2
      const sharesWeight = 0.1

      // 标准化处理（基于当前批次的最大值）
      const maxLikes = Math.max(...posts.map(p => p.stats.likes))
      const maxComments = Math.max(...posts.map(p => p.stats.comments))
      const maxCollections = Math.max(...posts.map(p => p.stats.collections))
      const maxShares = Math.max(...posts.map(p => p.stats.shares))

      const normalizedLikes = maxLikes > 0 ? post.stats.likes / maxLikes : 0
      const normalizedComments = maxComments > 0 ? post.stats.comments / maxComments : 0
      const normalizedCollections = maxCollections > 0 ? post.stats.collections / maxCollections : 0
      const normalizedShares = maxShares > 0 ? post.stats.shares / maxShares : 0

      const trendingScore = (
        normalizedLikes * likesWeight +
        normalizedComments * commentsWeight +
        normalizedCollections * collectionsWeight +
        normalizedShares * sharesWeight
      ) * 100

      return {
        ...post,
        trendingScore: Math.round(trendingScore * 100) / 100,
        ranking: 0 // 将在排序后设置
      }
    })

    // 按得分排序并设置排名
    trendingPosts.sort((a, b) => b.trendingScore - a.trendingScore)
    trendingPosts.forEach((post, index) => {
      post.ranking = index + 1
    })

    return trendingPosts
  }

  /**
   * 生成关键词哈希
   */
  private generateKeywordsHash(keywords: string): string {
    // 简单的哈希函数，实际应用中可以使用更强的算法
    return Buffer.from(keywords.toLowerCase().trim()).toString('base64')
  }

  /**
   * 从缓存获取搜索结果
   */
  private async getCachedSearchResult(keywordsHash: string): Promise<KeywordSearchResult | null> {
    try {
      const { data, error } = await supabase
        .from('xhs_search_cache')
        .select('*')
        .eq('keywords_hash', keywordsHash)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) {
        return null
      }

      return {
        keyword: data.keywords,
        posts: data.results_data.posts || [],
        totalFound: data.result_count,
        cached: true,
        searchTime: new Date(data.search_timestamp)
      }
    } catch (error) {
      console.warn('获取搜索缓存失败:', error)
      return null
    }
  }

  /**
   * 缓存搜索结果
   */
  private async cacheSearchResult(
    keywordsHash: string,
    keywords: string,
    result: KeywordSearchResult
  ): Promise<void> {
    try {
      const cacheData = {
        keywords,
        keywords_hash: keywordsHash,
        search_type: 'trending',
        results_data: {
          posts: result.posts,
          totalFound: result.totalFound,
          searchTime: result.searchTime
        },
        result_count: result.posts.length
      }

      await supabase
        .from('xhs_search_cache')
        .upsert(cacheData, { onConflict: 'keywords_hash' })

    } catch (error) {
      console.warn('缓存搜索结果失败:', error)
      // 缓存失败不影响主流程
    }
  }

  /**
   * 缓存帖子数据
   */
  private async cachePosts(posts: XHSPost[]): Promise<void> {
    for (const post of posts) {
      try {
        // 先缓存作者信息
        await this.cacheUser(post.author.userId, {
          nickname: post.author.nickname,
          avatar: post.author.avatar
        })

        // 缓存帖子信息
        const postData = {
          post_id: post.id,
          post_url: post.url,
          title: post.title,
          description: post.description,
          author_user_id: post.author.userId,
          author_nickname: post.author.nickname,
          author_avatar: post.author.avatar,
          likes_count: post.stats.likes,
          comments_count: post.stats.comments,
          shares_count: post.stats.shares,
          collections_count: post.stats.collections,
          publish_time: post.publishTime.toISOString(),
          images: post.images || []
        }

        await supabase
          .from('xhs_posts_cache')
          .upsert(postData, { onConflict: 'post_id' })

      } catch (error) {
        console.warn(`缓存帖子数据失败: ${post.id}`, error)
        // 继续处理其他帖子
      }
    }
  }

  /**
   * 缓存用户信息
   */
  private async cacheUser(userId: string, userInfo: {
    nickname: string
    avatar?: string
  }): Promise<void> {
    try {
      const userData = {
        user_id: userId,
        nickname: userInfo.nickname,
        avatar_url: userInfo.avatar || null,
        is_active: true
      }

      await supabase
        .from('xhs_users_cache')
        .upsert(userData, { onConflict: 'user_id' })

    } catch (error) {
      console.warn(`缓存用户数据失败: ${userId}`, error)
    }
  }

  /**
   * 获取热门搜索关键词统计
   */
  async getPopularKeywords(limit: number = 10): Promise<{
    keyword: string
    searchCount: number
    lastSearched: Date
  }[]> {
    try {
      const { data, error } = await supabase
        .from('xhs_search_cache')
        .select('keywords, search_timestamp')
        .order('search_timestamp', { ascending: false })
        .limit(100) // 获取最近100条记录进行统计

      if (error || !data) {
        return []
      }

      // 统计关键词出现频率
      const keywordCount = new Map<string, { count: number, lastSearched: Date }>()

      data.forEach(record => {
        const keyword = record.keywords
        const searchTime = new Date(record.search_timestamp)

        if (keywordCount.has(keyword)) {
          const current = keywordCount.get(keyword)!
          current.count++
          if (searchTime > current.lastSearched) {
            current.lastSearched = searchTime
          }
        } else {
          keywordCount.set(keyword, {
            count: 1,
            lastSearched: searchTime
          })
        }
      })

      // 转换为数组并排序
      return Array.from(keywordCount.entries())
        .map(([keyword, stats]) => ({
          keyword,
          searchCount: stats.count,
          lastSearched: stats.lastSearched
        }))
        .sort((a, b) => b.searchCount - a.searchCount)
        .slice(0, limit)

    } catch (error) {
      console.warn('获取热门关键词统计失败:', error)
      return []
    }
  }
}

// 导出单例
export const keywordSearchService = new KeywordSearchService()

// 导出类以支持测试
export { KeywordSearchService }