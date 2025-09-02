import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBeijingDateString } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing student_id parameter' },
        { status: 400 }
      )
    }

    console.log(`📊 [Checkin Records API] 获取学员打卡记录: ${studentId}, limit: ${limit}, offset: ${offset}`)

    // 查询打卡记录
    const { data: records, error } = await supabase
      .from('student_checkins')
      .select('*')
      .eq('student_id', studentId)
      .order('checkin_date', { ascending: false })
      .range(offset, offset + limit - 1)

    console.log(`🔍 [Checkin Records API] 数据库查询结果:`, {
      records: records,
      recordsLength: records?.length || 0,
      error: error
    })

    if (error) {
      console.error('❌ [Checkin Records API] 查询打卡记录失败:', error)
      console.error('❌ [Checkin Records API] 错误详情:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { error: 'Failed to fetch checkin records: ' + error.message },
        { status: 500 }
      )
    }

    // 获取总数
    const { count, error: countError } = await supabase
      .from('student_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)

    if (countError) {
      console.error('查询打卡记录总数失败:', countError)
    }

    console.log(`✅ [Checkin Records API] 返回 ${records?.length || 0} 条记录`)

    return NextResponse.json({
      success: true,
      records: records || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error: any) {
    console.error('Checkin records API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, xiaohongshu_link, checkin_date } = body

    if (!student_id || !xiaohongshu_link) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, xiaohongshu_link' },
        { status: 400 }
      )
    }

    // 验证小红书链接格式
    const xhsLinkPattern = /^https?:\/\/(www\.)?xiaohongshu\.com\//
    if (!xhsLinkPattern.test(xiaohongshu_link)) {
      return NextResponse.json(
        { error: 'Invalid xiaohongshu link format' },
        { status: 400 }
      )
    }

    const today = checkin_date || getBeijingDateString()

    console.log(`📝 [Checkin Records API] 创建打卡记录: ${student_id} - ${today}`)

    // 使用 upsert 来处理同一天的重复打卡
    const { data, error } = await supabase
      .from('student_checkins')
      .upsert({
        student_id,
        checkin_date: today,
        xiaohongshu_link,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id,checkin_date'
      })
      .select()

    if (error) {
      console.error('创建打卡记录失败:', error)
      return NextResponse.json(
        { error: 'Failed to create checkin record' },
        { status: 500 }
      )
    }

    console.log(`✅ [Checkin Records API] 打卡记录创建成功`)

    return NextResponse.json({
      success: true,
      record: data?.[0],
      message: '打卡成功'
    })

  } catch (error: any) {
    console.error('Checkin records POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
