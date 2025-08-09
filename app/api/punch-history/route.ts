import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const month = searchParams.get('month') // Format: YYYY-MM

    if (!studentId) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      )
    }

    // 获取用户ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', studentId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let query = supabase
      .from('punch_cards')
      .select('*')
      .eq('user_id', userData.id)
      .order('post_created_at', { ascending: false })

    // 如果指定了月份，按月份筛选
    if (month) {
      const startDate = `${month}-01`
      const endDate = `${month}-31`
      query = query
        .gte('post_created_at', startDate)
        .lte('post_created_at', endDate)
    }

    const { data: punchRecords, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch punch records' },
        { status: 500 }
      )
    }

    // 计算统计数据
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const currentMonthRecords = punchRecords?.filter(record => 
      record.post_created_at.startsWith(currentMonth)
    ) || []

    const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const punchRate = currentMonthRecords.length > 0 
      ? Math.round((currentMonthRecords.length / daysInCurrentMonth) * 100) 
      : 0

    const stats = {
      totalDays: punchRecords?.length || 0,
      thisMonthDays: currentMonthRecords.length,
      punchRate: punchRate
    }

    return NextResponse.json({
      records: month ? punchRecords : currentMonthRecords,
      stats: stats
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}