import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface HotFeedRequest {
  days?: number // 统计天数，默认30天
  limit?: number // 返回数量限制，默认10
  type?: 'all' | 'student_viral' | 'search_trending' // 类型过滤
}

interface HotNote {
  note_id: string
  title: string
  author_name: string
  liked_count: number
  comment_count: number
  cover_url?: string
  url: string
  source: 'student_viral' | 'search_trending' | 'demo'
  score: number
  published_at?: string
  student_id?: string // 对于学员爆款
  search_frequency?: number // 对于搜索热门
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = (searchParams.get('type') || 'all') as 'all' | 'student_viral' | 'search_trending'

    console.log(`🔥 [Hot Feed] 获取热门内容，天数: ${days}, 限制: ${limit}, 类型: ${type}`)

    let allHotNotes: HotNote[] = []

    // 获取学员优秀爆款
    if (type === 'all' || type === 'student_viral') {
      const studentViral = await getStudentViralNotes(days, Math.ceil(limit / 2))
      allHotNotes.push(...studentViral)
    }

    // 获取搜索热门
    if (type === 'all' || type === 'search_trending') {
      const searchTrending = await getSearchTrendingNotes(days, Math.ceil(limit / 2))
      allHotNotes.push(...searchTrending)
    }

    // 如果没有真实数据，生成演示数据
    if (allHotNotes.length === 0) {
      console.log(`📝 [Hot Feed] 没有真实数据，生成演示数据`)
      allHotNotes = generateDemoHotNotes(limit)
    }

    // 按分数排序并限制数量
    allHotNotes.sort((a, b) => b.score - a.score)
    const finalNotes = allHotNotes.slice(0, limit)

    // 随机打乱顺序（轮播效果）
    const shuffledNotes = shuffleArray([...finalNotes])

    return NextResponse.json({
      success: true,
      data: {
        total_count: shuffledNotes.length,
        period_days: days,
        notes: shuffledNotes,
        categories: {
          student_viral: shuffledNotes.filter(n => n.source === 'student_viral').length,
          search_trending: shuffledNotes.filter(n => n.source === 'search_trending').length,
          demo: shuffledNotes.filter(n => n.source === 'demo').length
        },
        message: shuffledNotes.length > 0 ? '热门内容获取成功' : '暂无热门内容'
      }
    })

  } catch (error: any) {
    console.error('Hot feed error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hot feed', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

// 获取学员优秀爆款（来源：checkins → notes_cache）
async function getStudentViralNotes(days: number, limit: number): Promise<HotNote[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 获取最近N天内学员提交的笔记，按点赞数排序
    const { data: viralNotes, error } = await supabase
      .from('xhs_checkins')
      .select(`
        student_id,
        links,
        date,
        xhs_notes_cache!inner(
          note_id,
          title,
          author_name,
          liked_count,
          comment_count,
          cover_url,
          url,
          published_at
        )
      `)
      .gte('date', startDate.toISOString().split('T')[0])
      .eq('passed', true)
      .order('xhs_notes_cache.liked_count', { ascending: false })
      .limit(limit * 2) // 获取更多数据用于去重

    if (error) {
      console.error('Failed to fetch student viral notes:', error)
      return []
    }

    if (!viralNotes || viralNotes.length === 0) {
      return []
    }

    // 处理数据并去重
    const processedNotes = new Map<string, HotNote>()

    viralNotes.forEach((checkin: any) => {
      const note = checkin.xhs_notes_cache
      if (note && note.liked_count >= 10) { // 至少10个赞才算爆款
        const score = calculateViralScore(note.liked_count, note.comment_count, checkin.date)
        
        if (!processedNotes.has(note.note_id) || processedNotes.get(note.note_id)!.score < score) {
          processedNotes.set(note.note_id, {
            note_id: note.note_id,
            title: note.title || '学员优秀作品',
            author_name: note.author_name || '学员',
            liked_count: note.liked_count,
            comment_count: note.comment_count,
            cover_url: note.cover_url,
            url: note.url,
            source: 'student_viral',
            score,
            published_at: note.published_at,
            student_id: checkin.student_id
          })
        }
      }
    })

    return Array.from(processedNotes.values()).slice(0, limit)

  } catch (error) {
    console.error('Error fetching student viral notes:', error)
    return []
  }
}

// 获取搜索热门（来源：search_logs 聚合 keyword 热度）
async function getSearchTrendingNotes(days: number, limit: number): Promise<HotNote[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 获取热门搜索关键词
    const { data: searchLogs, error: searchError } = await supabase
      .from('xhs_search_logs')
      .select('keywords, top_note_ids')
      .gte('created_at', startDate.toISOString())
      .limit(100)

    if (searchError) {
      console.error('Failed to fetch search logs:', searchError)
      return []
    }

    // 统计关键词频率
    const keywordFreq = new Map<string, number>()
    const noteIdFreq = new Map<string, number>()

    searchLogs?.forEach(log => {
      if (log.keywords && Array.isArray(log.keywords)) {
        log.keywords.forEach((keyword: string) => {
          keywordFreq.set(keyword, (keywordFreq.get(keyword) || 0) + 1)
        })
      }
      if (log.top_note_ids && Array.isArray(log.top_note_ids)) {
        log.top_note_ids.forEach((noteId: string) => {
          noteIdFreq.set(noteId, (noteIdFreq.get(noteId) || 0) + 1)
        })
      }
    })

    // 获取热门关键词的前10个
    const topKeywords = Array.from(keywordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword)

    // 获取这些关键词对应的热门笔记
    const trendingNotes: HotNote[] = []

    for (const keyword of topKeywords) {
      const { data: notes, error: notesError } = await supabase
        .from('xhs_notes_cache')
        .select('*')
        .or(`title.ilike.%${keyword}%`)
        .order('liked_count', { ascending: false })
        .limit(2)

      if (!notesError && notes) {
        notes.forEach(note => {
          const searchFreq = keywordFreq.get(keyword) || 0
          const score = calculateTrendingScore(note.liked_count, note.comment_count, searchFreq)
          
          trendingNotes.push({
            note_id: note.note_id,
            title: note.title || `热门${keyword}内容`,
            author_name: note.author_name || '热门博主',
            liked_count: note.liked_count,
            comment_count: note.comment_count,
            cover_url: note.cover_url,
            url: note.url,
            source: 'search_trending',
            score,
            published_at: note.published_at,
            search_frequency: searchFreq
          })
        })
      }
    }

    // 去重并排序
    const uniqueNotes = new Map<string, HotNote>()
    trendingNotes.forEach(note => {
      if (!uniqueNotes.has(note.note_id) || uniqueNotes.get(note.note_id)!.score < note.score) {
        uniqueNotes.set(note.note_id, note)
      }
    })

    return Array.from(uniqueNotes.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

  } catch (error) {
    console.error('Error fetching search trending notes:', error)
    return []
  }
}

// 计算爆款分数
function calculateViralScore(likes: number, comments: number, date: string): number {
  const baseScore = likes * 2 + comments * 5
  
  // 时间衰减：越新的内容分数越高
  const daysSincePost = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  const timeDecay = Math.max(0.1, 1 - daysSincePost * 0.05)
  
  return baseScore * timeDecay
}

// 计算热门分数
function calculateTrendingScore(likes: number, comments: number, searchFreq: number): number {
  const baseScore = likes * 1.5 + comments * 3
  const searchBoost = Math.log(searchFreq + 1) * 10
  
  return baseScore + searchBoost
}

// 生成演示数据
function generateDemoHotNotes(limit: number): HotNote[] {
  const demoTopics = ['美食探店', '旅行攻略', '穿搭分享', '护肤心得', '健身日记', '学习方法', '生活好物', '摄影技巧']
  const notes: HotNote[] = []

  for (let i = 0; i < limit; i++) {
    const topic = demoTopics[i % demoTopics.length]
    const likes = Math.floor(Math.random() * 5000) + 500
    const comments = Math.floor(likes * 0.1) + Math.floor(Math.random() * 100)
    
    notes.push({
      note_id: `demo_hot_${i.toString().padStart(3, '0')}`,
      title: `${topic} - 超火爆分享 ${i + 1}`,
      author_name: `热门博主${i + 1}`,
      liked_count: likes,
      comment_count: comments,
      cover_url: `https://via.placeholder.com/300x400/ff6b6b/ffffff?text=${encodeURIComponent(topic)}`,
      url: `https://www.xiaohongshu.com/explore/demo_hot_${i}`,
      source: 'demo',
      score: likes * 2 + comments * 5,
      published_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    })
  }

  return notes
}

// 数组随机打乱
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
