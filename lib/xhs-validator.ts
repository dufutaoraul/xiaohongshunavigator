// 小红书帖子验证工具
interface XHSValidationResult {
  isValid: boolean
  reason?: string
  userInfo?: {
    userId?: string
    userUrl?: string
  }
  duplicateInfo?: {
    studentId: string
    url: string
  }
}

interface XHSUrlInfo {
  postId?: string
  userId?: string
  userUrl?: string
  isValidXHSUrl: boolean
}

/**
 * 解析小红书URL，提取帖子ID和用户信息
 * 支持的URL格式：
 * - https://www.xiaohongshu.com/explore/[postId]
 * - https://xhslink.com/[shortCode]
 * - https://www.xiaohongshu.com/user/profile/[userId]
 */
export function parseXHSUrl(url: string): XHSUrlInfo {
  try {
    const urlObj = new URL(url)

    // 检查是否为小红书域名
    if (!urlObj.hostname.includes('xiaohongshu.com') && !urlObj.hostname.includes('xhslink.com')) {
      return { isValidXHSUrl: false }
    }

    const result: XHSUrlInfo = { isValidXHSUrl: true }

    // 解析 xiaohongshu.com 链接
    if (urlObj.hostname.includes('xiaohongshu.com')) {
      const path = urlObj.pathname

      // 帖子链接格式: /explore/[postId] 或 /discovery/item/[postId]
      const postMatch = path.match(/\/(explore|discovery\/item)\/([a-fA-F0-9]+)/)
      if (postMatch) {
        result.postId = postMatch[2]
      }

      // 用户主页格式: /user/profile/[userId]
      const userMatch = path.match(/\/user\/profile\/([a-fA-F0-9]+)/)
      if (userMatch) {
        result.userId = userMatch[1]
        result.userUrl = `https://www.xiaohongshu.com/user/profile/${result.userId}`
      }
    }

    // 解析 xhslink.com 短链接 (需要后续扩展获取真实链接)
    if (urlObj.hostname.includes('xhslink.com')) {
      // 短链接暂时标记为有效，但无法直接解析用户信息
      // 实际使用中可能需要通过API或爬虫展开短链接
    }

    return result
  } catch (error) {
    return { isValidXHSUrl: false }
  }
}

/**
 * 验证小红书帖子是否符合要求
 * @param postUrl 帖子链接
 * @param userProfileUrl 用户绑定的小红书主页链接
 * @param existingRecords 已存在的帖子记录列表（用于重复检测）
 */
export function validateXHSPost(
  postUrl: string,
  userProfileUrl?: string,
  existingRecords: Array<{xhs_url: string, student_id: string}> = []
): XHSValidationResult {

  // 1. 基础URL格式验证
  const postInfo = parseXHSUrl(postUrl)
  if (!postInfo.isValidXHSUrl) {
    return {
      isValid: false,
      reason: '不是有效的小红书链接格式'
    }
  }

  // 2. 重复检测
  const normalizedPostUrl = normalizeXHSUrl(postUrl)
  const duplicateRecord = existingRecords.find(record =>
    normalizeXHSUrl(record.xhs_url) === normalizedPostUrl
  )

  if (duplicateRecord) {
    return {
      isValid: false,
      reason: `该帖子链接已经被学员 ${duplicateRecord.student_id} 提交过了`,
      duplicateInfo: {
        studentId: duplicateRecord.student_id,
        url: duplicateRecord.xhs_url
      }
    }
  }

  // 3. 如果用户绑定了主页，进行主页匹配验证
  if (userProfileUrl) {
    const userInfo = parseXHSUrl(userProfileUrl)
    if (userInfo.userId && postInfo.postId) {
      // TODO: 这里需要通过API或其他方式验证帖子是否属于该用户
      // 目前先通过URL模式匹配进行基础验证
      return {
        isValid: true,
        reason: '通过基础验证（需要进一步API验证）',
        userInfo: {
          userId: userInfo.userId,
          userUrl: userInfo.userUrl
        }
      }
    }
  }

  // 4. 未绑定主页的情况，只进行基础验证
  return {
    isValid: true,
    reason: '基础URL格式验证通过'
  }
}

/**
 * 标准化小红书URL，用于重复检测
 * 去除参数和锚点，统一格式
 */
export function normalizeXHSUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`
    return baseUrl.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

/**
 * 检测用户是否已绑定小红书主页
 */
export function hasXHSProfileBound(profileUrl?: string): boolean {
  if (!profileUrl) return false
  const info = parseXHSUrl(profileUrl)
  return info.isValidXHSUrl && !!info.userId
}