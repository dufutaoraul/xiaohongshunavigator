import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface CheckinRequest {
  student_id: string
  urls: string[]
  date?: string // 可选，默认为今天
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckinRequest = await request.json()
    const { student_id, urls, date } = body

    if (!student_id) {
      return NextResponse.json(
        { error: 'Missing student_id parameter' },
        { status: 400 }
      )
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty urls array' },
        { status: 400 }
      )
    }

    // 验证 URLs 格式
    const validUrls = urls.filter(url => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    })

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid URLs provided' },
        { status: 400 }
      )
    }

    // 使用提供的日期或今天
    const checkinDate = date || new Date().toISOString().split('T')[0]
    
    console.log(`📝 [Checkin] 学员 ${student_id} 提交打卡，日期: ${checkinDate}, URLs: ${validUrls.length}个`)

    // 检查今天是否已经打卡
    const { data: existingCheckin, error: checkError } = await supabase
      .from('xhs_checkins')
      .select('id, links, passed')
      .eq('student_id', student_id)
      .eq('date', checkinDate)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Failed to check existing checkin:', checkError)
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      )
    }

    // 判断是否合格：只要有1个或以上的有效URL就合格
    const passed = validUrls.length >= 1

    let result
    if (existingCheckin) {
      // 更新现有打卡记录
      console.log(`🔄 [Checkin] 更新现有打卡记录`)
      const { data, error } = await supabase
        .from('xhs_checkins')
        .update({
          links: validUrls,
          passed,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCheckin.id)
        .select()
        .single()

      if (error) {
        console.error('Failed to update checkin:', error)
        return NextResponse.json(
          { error: 'Failed to update checkin record' },
          { status: 500 }
        )
      }
      result = data
    } else {
      // 创建新的打卡记录
      console.log(`✨ [Checkin] 创建新打卡记录`)
      const { data, error } = await supabase
        .from('xhs_checkins')
        .insert({
          student_id,
          date: checkinDate,
          links: validUrls,
          passed
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create checkin:', error)
        return NextResponse.json(
          { error: 'Failed to create checkin record' },
          { status: 500 }
        )
      }
      result = data
    }

    // 更新笔记缓存（从URL中提取note_id）
    await updateNotesFromUrls(validUrls)

    // 检查点赞里程碑
    await checkNoteLikeMilestones(validUrls, student_id)

    return NextResponse.json({
      success: true,
      data: {
        checkin_id: result.id,
        student_id,
        date: checkinDate,
        urls_submitted: validUrls.length,
        urls_valid: validUrls.length,
        passed,
        message: passed ? '打卡成功！' : '打卡失败，需要至少提交1个有效链接',
        is_update: !!existingCheckin
      }
    })

  } catch (error: any) {
    console.error('Checkin submit error:', error)
    return NextResponse.json(
      { error: 'Failed to submit checkin', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

// GET 方法：获取打卡历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const student_id = searchParams.get('student_id')
    const days = parseInt(searchParams.get('days') || '30')

    if (!student_id) {
      return NextResponse.json(
        { error: 'Missing student_id parameter' },
        { status: 400 }
      )
    }

    // 获取最近N天的打卡记录
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: checkins, error } = await supabase
      .from('xhs_checkins')
      .select('*')
      .eq('student_id', student_id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) {
      console.error('Failed to fetch checkin history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch checkin history' },
        { status: 500 }
      )
    }

    // 统计信息
    const totalDays = checkins?.length || 0
    const passedDays = checkins?.filter(c => c.passed).length || 0
    const totalUrls = checkins?.reduce((sum, c) => sum + (c.links?.length || 0), 0) || 0

    return NextResponse.json({
      success: true,
      data: {
        student_id,
        period_days: days,
        total_checkin_days: totalDays,
        passed_days: passedDays,
        total_urls_submitted: totalUrls,
        pass_rate: totalDays > 0 ? (passedDays / totalDays * 100).toFixed(1) : '0.0',
        checkins: checkins || []
      }
    })

  } catch (error: any) {
    console.error('Checkin history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checkin history', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

// 从URLs更新笔记缓存
async function updateNotesFromUrls(urls: string[]) {
  for (const url of urls) {
    try {
      // 从小红书URL中提取note_id
      const noteId = extractNoteIdFromUrl(url)
      if (noteId) {
        // 检查缓存中是否已存在
        const { data: existing } = await supabase
          .from('xhs_notes_cache')
          .select('note_id')
          .eq('note_id', noteId)
          .single()

        if (!existing) {
          // 创建基础缓存记录
          await supabase
            .from('xhs_notes_cache')
            .insert({
              note_id: noteId,
              title: '用户提交的笔记',
              url: url,
              last_seen_at: new Date().toISOString()
            })
        } else {
          // 更新最后见到时间
          await supabase
            .from('xhs_notes_cache')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('note_id', noteId)
        }
      }
    } catch (error) {
      console.error(`Failed to process URL ${url}:`, error)
    }
  }
}

// 检查笔记点赞里程碑
async function checkNoteLikeMilestones(urls: string[], student_id: string) {
  for (const url of urls) {
    try {
      const noteId = extractNoteIdFromUrl(url)
      if (noteId) {
        // 获取笔记的当前点赞数（如果缓存中有的话）
        const { data: note } = await supabase
          .from('xhs_notes_cache')
          .select('liked_count')
          .eq('note_id', noteId)
          .single()

        if (note && note.liked_count >= 10) {
          // 检查是否已经有提醒
          const { data: existingAlert } = await supabase
            .from('xhs_alerts')
            .select('id')
            .eq('note_id', noteId)
            .eq('student_id', student_id)
            .eq('alert_type', 'like_milestone')
            .single()

          if (!existingAlert) {
            // 创建新提醒
            await supabase
              .from('xhs_alerts')
              .insert({
                student_id,
                note_id: noteId,
                liked_count: note.liked_count,
                alert_type: 'like_milestone'
              })
          }
        }
      }
    } catch (error) {
      console.error(`Failed to check milestone for URL ${url}:`, error)
    }
  }
}

// 从小红书URL中提取note_id
function extractNoteIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    
    // 匹配不同的小红书URL格式
    const patterns = [
      /\/explore\/([a-f0-9]+)/i,  // https://www.xiaohongshu.com/explore/xxxxx
      /\/discovery\/item\/([a-f0-9]+)/i,  // https://www.xiaohongshu.com/discovery/item/xxxxx
      /note_id=([a-f0-9]+)/i,  // 查询参数中的note_id
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  } catch {
    return null
  }
}
