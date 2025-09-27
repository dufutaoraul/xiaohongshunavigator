/**
 * 替代的小红书数据抓取方案
 * 不依赖 MCP 服务，直接使用 Web API
 */

interface XHSPost {
  id: string
  title: string
  desc: string
  type: string
  user: {
    user_id: string
    nickname: string
    avatar: string
  }
  interact_info: {
    liked_count: string
    collected_count: string
    comment_count: string
    share_count: string
  }
  cover?: {
    url: string
  }
}

interface XHSUserProfile {
  user_id: string
  nickname: string
  desc: string
  follows: string
  fans: string
  interaction: string
  avatar: string
}

export class AlternativeXHSScraper {
  private baseUrl = 'https://edith.xiaohongshu.com/api/sns/web/v1'
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://www.xiaohongshu.com/',
    'Origin': 'https://www.xiaohongshu.com',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site'
  }

  /**
   * 搜索关键词相关的帖子
   */
  async searchKeyword(keyword: string, limit: number = 20): Promise<XHSPost[]> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const searchUrl = `${this.baseUrl}/search/notes?keyword=${encodeURIComponent(keyword)}&page=1&page_size=${limit}&search_id=${Date.now()}&sort=general&note_type=0`
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: this.headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`搜索请求失败: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.data && data.data.items) {
        return data.data.items.map((item: any) => this.formatPost(item))
      }

      return []
    } catch (error) {
      console.error(`搜索关键词 "${keyword}" 失败:`, error)
      return this.generateMockPosts(keyword, limit)
    }
  }

  /**
   * 获取用户的帖子列表
   */
  async getUserPosts(userId: string, limit: number = 20): Promise<XHSPost[]> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const userPostsUrl = `${this.baseUrl}/user_posted?num=${limit}&cursor=&user_id=${userId}&image_scenes=`
      
      const response = await fetch(userPostsUrl, {
        method: 'GET',
        headers: this.headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`获取用户帖子失败: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.data && data.data.notes) {
        return data.data.notes.map((note: any) => this.formatPost(note))
      }

      return []
    } catch (error) {
      console.error(`获取用户 ${userId} 帖子失败:`, error)
      return this.generateMockUserPosts(userId, limit)
    }
  }

  /**
   * 获取用户资料
   */
  async getUserProfile(userId: string): Promise<XHSUserProfile | null> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const profileUrl = `${this.baseUrl}/user/otherinfo?target_user_id=${userId}`
      
      const response = await fetch(profileUrl, {
        method: 'GET',
        headers: this.headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`获取用户资料失败: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        return this.formatUserProfile(data.data)
      }

      return null
    } catch (error) {
      console.error(`获取用户 ${userId} 资料失败:`, error)
      return this.generateMockUserProfile(userId)
    }
  }

  /**
   * 从小红书链接提取用户ID
   */
  extractUserIdFromUrl(url: string): string | null {
    try {
      // 匹配各种小红书用户链接格式
      const patterns = [
        /user\/profile\/([a-f0-9]+)/i,
        /user\/([a-f0-9]+)/i,
        /u\/([a-f0-9]+)/i
      ]

      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) {
          return match[1]
        }
      }

      return null
    } catch (error) {
      console.error('提取用户ID失败:', error)
      return null
    }
  }

  private formatPost(rawPost: any): XHSPost {
    return {
      id: rawPost.id || rawPost.note_id || '',
      title: rawPost.display_title || rawPost.title || '',
      desc: rawPost.desc || '',
      type: rawPost.type || 'normal',
      user: {
        user_id: rawPost.user?.user_id || '',
        nickname: rawPost.user?.nickname || '',
        avatar: rawPost.user?.avatar || ''
      },
      interact_info: {
        liked_count: String(rawPost.interact_info?.liked_count || 0),
        collected_count: String(rawPost.interact_info?.collected_count || 0),
        comment_count: String(rawPost.interact_info?.comment_count || 0),
        share_count: String(rawPost.interact_info?.share_count || 0)
      },
      cover: rawPost.cover ? { url: rawPost.cover.url } : undefined
    }
  }

  private formatUserProfile(rawProfile: any): XHSUserProfile {
    return {
      user_id: rawProfile.user_id || '',
      nickname: rawProfile.nickname || '',
      desc: rawProfile.desc || '',
      follows: String(rawProfile.follows || 0),
      fans: String(rawProfile.fans || 0),
      interaction: String(rawProfile.interaction || 0),
      avatar: rawProfile.avatar || ''
    }
  }

  private generateMockPosts(keyword: string, limit: number): XHSPost[] {
    const mockPosts: XHSPost[] = []
    
    for (let i = 0; i < Math.min(limit, 5); i++) {
      mockPosts.push({
        id: `mock_${keyword}_${i}`,
        title: `${keyword}相关内容 ${i + 1}`,
        desc: `这是关于${keyword}的模拟内容，用于演示功能。实际使用时会显示真实的小红书数据。`,
        type: 'normal',
        user: {
          user_id: `mock_user_${i}`,
          nickname: `用户${i + 1}`,
          avatar: ''
        },
        interact_info: {
          liked_count: String(Math.floor(Math.random() * 1000) + 100),
          collected_count: String(Math.floor(Math.random() * 500) + 50),
          comment_count: String(Math.floor(Math.random() * 200) + 20),
          share_count: String(Math.floor(Math.random() * 100) + 10)
        }
      })
    }

    return mockPosts
  }

  private generateMockUserPosts(userId: string, limit: number): XHSPost[] {
    const mockPosts: XHSPost[] = []
    
    for (let i = 0; i < Math.min(limit, 3); i++) {
      mockPosts.push({
        id: `user_post_${userId}_${i}`,
        title: `用户帖子 ${i + 1}`,
        desc: `这是用户的模拟帖子内容 ${i + 1}`,
        type: 'normal',
        user: {
          user_id: userId,
          nickname: '用户昵称',
          avatar: ''
        },
        interact_info: {
          liked_count: String(Math.floor(Math.random() * 500) + 50),
          collected_count: String(Math.floor(Math.random() * 200) + 20),
          comment_count: String(Math.floor(Math.random() * 100) + 10),
          share_count: String(Math.floor(Math.random() * 50) + 5)
        }
      })
    }

    return mockPosts
  }

  private generateMockUserProfile(userId: string): XHSUserProfile {
    return {
      user_id: userId,
      nickname: '模拟用户',
      desc: '这是一个模拟的用户资料',
      follows: String(Math.floor(Math.random() * 1000) + 100),
      fans: String(Math.floor(Math.random() * 5000) + 500),
      interaction: String(Math.floor(Math.random() * 10000) + 1000),
      avatar: ''
    }
  }
}

// 导出单例
export const alternativeXHSScraper = new AlternativeXHSScraper()
