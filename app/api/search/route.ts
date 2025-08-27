import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface SearchRequest {
  keyword?: string
  keywords?: string[]
  page?: number
  page_size?: number
  sort?: 'general' | 'time' | 'like'
  cookie?: string
  student_id?: string
}

interface NoteResult {
  note_id: string
  title: string
  author: string
  nickname: string
  liked_count: number
  comment_count: number
  cover_image?: string
  url: string
  published_at?: string
  source: 'real' | 'demo'
}

// 排序映射
const SORT_MAPPING = {
  'general': 'general',
  'time': 'time_descending', 
  'like': 'like_descending'
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json()
    const { 
      keyword, 
      keywords = [], 
      page = 1, 
      page_size = 10, 
      sort = 'general',
      cookie,
      student_id 
    } = body

    // 处理关键词：支持单个关键词或关键词数组
    let searchKeywords: string[] = []
    if (keyword) {
      searchKeywords = [keyword]
    }
    if (keywords && keywords.length > 0) {
      searchKeywords = [...searchKeywords, ...keywords]
    }
    
    // 去重并取第一个作为主要搜索词
    searchKeywords = Array.from(new Set(searchKeywords))
    const primaryKeyword = searchKeywords[0]

    if (!primaryKeyword) {
      return NextResponse.json(
        { error: 'Missing keyword or keywords parameter' },
        { status: 400 }
      )
    }

    console.log(`🔍 [Search API] 搜索关键词: ${searchKeywords.join(', ')}, 主关键词: ${primaryKeyword}`)
    console.log(`📊 [Search API] 排序: ${sort}, 页码: ${page}, 页面大小: ${page_size}`)

    // 获取 Cookie
    let xhsCookie = cookie
    if (!xhsCookie) {
      xhsCookie = request.headers.get('x-xhs-cookie') || undefined
    }

    console.log(`🍪 [Search API] Cookie状态: ${xhsCookie ? `有 (${xhsCookie.length}字符)` : '无'}`)

    let searchResults: NoteResult[] = []
    let resultSource = 'demo'

    // 尝试直接调用小红书API
    if (xhsCookie) {
      try {
        console.log(`🚀 [Search API] 直接调用小红书API`)

        // 构建小红书搜索URL
        const searchUrl = `https://edith.xiaohongshu.com/api/sns/web/v1/search/notes`
        const params = new URLSearchParams({
          keyword: primaryKeyword,
          page: page.toString(),
          page_size: page_size.toString(),
          search_id: Date.now().toString(),
          sort: SORT_MAPPING[sort] || sort
        })

        const response = await fetch(`${searchUrl}?${params}`, {
          method: 'GET',
          headers: {
            'Cookie': xhsCookie,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.xiaohongshu.com/',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'X-Requested-With': 'XMLHttpRequest'
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`✅ [Search API] 小红书API 响应成功`)

          if (data.success && data.data && data.data.items) {
            searchResults = data.data.items.map((item: any) => {
              const note = item.note_card || item
              return {
                note_id: note.note_id || '',
                title: note.display_title || note.title || '',
                author: note.user?.user_id || '',
                nickname: note.user?.nickname || '',
                liked_count: parseInt(note.interact_info?.liked_count || '0'),
                comment_count: parseInt(note.interact_info?.comment_count || '0'),
                cover_image: note.cover?.url_default || note.cover?.url,
                url: `https://www.xiaohongshu.com/explore/${note.note_id}`,
                published_at: note.time,
                source: 'real' as const
              }
            }).filter((note: any) => note.note_id) // 过滤掉无效数据

            resultSource = 'real'

            // 应用二次排序兜底
            searchResults = applySecondarySort(searchResults, sort)

            // 限制返回数量
            searchResults = searchResults.slice(0, page_size)

            console.log(`📊 [Search API] 获取到 ${searchResults.length} 条真实数据`)
          }
        } else {
          console.warn(`⚠️ [Search API] 小红书API 响应失败: ${response.status}`)
          const errorText = await response.text()
          console.warn(`错误详情: ${errorText}`)
        }
      } catch (error) {
        console.error(`❌ [Search API] 小红书API 调用失败:`, error)
      }
    }

    // 如果没有真实数据，返回演示数据
    if (searchResults.length === 0) {
      console.log(`📝 [Search API] 返回演示数据`)
      searchResults = generateDemoResults(primaryKeyword, page_size, sort)
      resultSource = 'demo'
    }

    // 记录搜索日志
    if (student_id) {
      try {
        await supabase
          .from('xhs_search_logs')
          .insert({
            student_id,
            keywords: searchKeywords,
            sort_type: sort,
            top_note_ids: searchResults.slice(0, 5).map(note => note.note_id),
            result_count: searchResults.length
          })
      } catch (logError) {
        console.error('Failed to log search:', logError)
      }
    }

    // 更新笔记缓存
    if (resultSource === 'real') {
      try {
        await updateNotesCache(searchResults)
      } catch (cacheError) {
        console.error('Failed to update notes cache:', cacheError)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        keyword: primaryKeyword,
        keywords: searchKeywords,
        page,
        page_size,
        sort,
        total_count: searchResults.length,
        notes: searchResults,
        source: resultSource,
        message: resultSource === 'real' ? '搜索成功' : 'Cookie无效或过期，返回演示数据'
      }
    })

  } catch (error: any) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

// GET 方法兼容性
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const keyword = searchParams.get('keyword') || searchParams.get('q')
  const keywords = searchParams.get('keywords')?.split(',').filter(k => k.trim()) || []
  const page = parseInt(searchParams.get('page') || '1')
  const page_size = parseInt(searchParams.get('page_size') || '10')
  const sort = (searchParams.get('sort') || 'general') as 'general' | 'time' | 'like'
  const cookie = searchParams.get('cookie')
  const student_id = searchParams.get('student_id')

  // 转换为 POST 请求
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      keyword,
      keywords,
      page,
      page_size,
      sort,
      cookie,
      student_id
    })
  })

  return POST(postRequest)
}

// 应用二次排序兜底
function applySecondarySort(notes: NoteResult[], sort: string): NoteResult[] {
  switch (sort) {
    case 'time':
      return notes.sort((a, b) => {
        if (a.published_at && b.published_at) {
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        }
        return 0
      })

    case 'like':
      return notes.sort((a, b) => b.liked_count - a.liked_count)

    case 'general':
    default:
      // 综合排序：点赞数 * 2 + 评论数
      return notes.sort((a, b) => {
        const scoreA = a.liked_count * 2 + a.comment_count
        const scoreB = b.liked_count * 2 + b.comment_count
        return scoreB - scoreA
      })
  }
}

// 生成演示数据
function generateDemoResults(keyword: string, count: number, sort: string): NoteResult[] {
  const demoNotes: NoteResult[] = []

  for (let i = 1; i <= count; i++) {
    const baseScore = Math.floor(Math.random() * 1000) + 100
    const liked_count = sort === 'like' ? baseScore * (count - i + 1) : baseScore + Math.floor(Math.random() * 500)
    const comment_count = Math.floor(liked_count * 0.1) + Math.floor(Math.random() * 50)

    demoNotes.push({
      note_id: `demo_${keyword}_${i.toString().padStart(3, '0')}`,
      title: `关于"${keyword}"的精彩分享 ${i}`,
      author: `demo_user_${i}`,
      nickname: `分享达人${i}`,
      liked_count,
      comment_count,
      cover_image: `https://via.placeholder.com/300x400/6366f1/ffffff?text=${encodeURIComponent(keyword)}+${i}`,
      url: `https://www.xiaohongshu.com/explore/demo_${keyword}_${i}`,
      published_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      source: 'demo'
    })
  }

  return applySecondarySort(demoNotes, sort)
}

// 更新笔记缓存
async function updateNotesCache(notes: NoteResult[]) {
  const cacheData = notes.map(note => ({
    note_id: note.note_id,
    title: note.title,
    cover_url: note.cover_image || '',
    author_id: note.author,
    author_name: note.nickname,
    liked_count: note.liked_count,
    comment_count: note.comment_count,
    url: note.url,
    published_at: note.published_at,
    last_seen_at: new Date().toISOString()
  }))

  // 使用 upsert 来更新或插入
  for (const noteData of cacheData) {
    try {
      await supabase
        .from('xhs_notes_cache')
        .upsert(noteData, { onConflict: 'note_id' })
    } catch (error) {
      console.error(`Failed to cache note ${noteData.note_id}:`, error)
    }
  }

  // 检查是否有笔记达到点赞里程碑
  await checkLikeMilestones(notes)
}

// 检查点赞里程碑并创建提醒
async function checkLikeMilestones(notes: NoteResult[]) {
  for (const note of notes) {
    if (note.source === 'real' && note.liked_count >= 10) {
      // 检查是否已经有这个提醒
      const { data: existingAlert } = await supabase
        .from('xhs_alerts')
        .select('id')
        .eq('note_id', note.note_id)
        .eq('alert_type', 'like_milestone')
        .single()

      if (!existingAlert) {
        // 创建新提醒
        await supabase
          .from('xhs_alerts')
          .insert({
            student_id: 'system', // 这里应该从上下文获取
            note_id: note.note_id,
            liked_count: note.liked_count,
            alert_type: 'like_milestone'
          })
      }
    }
  }
}
