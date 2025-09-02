import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBeijingDateString } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing student_id parameter' },
        { status: 400 }
      )
    }

    console.log(`📊 [Checkin Stats API] 获取打卡统计: ${studentId} - ${year}/${month}`)

    // 计算月份的开始和结束日期
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    // 查询该月的打卡记录
    const { data: records, error } = await supabase
      .from('student_checkins')
      .select('checkin_date, created_at')
      .eq('student_id', studentId)
      .gte('checkin_date', startDate)
      .lte('checkin_date', endDate)
      .order('checkin_date', { ascending: true })

    if (error) {
      console.error('查询打卡统计失败:', error)
      return NextResponse.json(
        { error: 'Failed to fetch checkin stats' },
        { status: 500 }
      )
    }

    // 生成该月的所有日期
    const daysInMonth = new Date(year, month, 0).getDate()
    const allDates = []
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day).toISOString().split('T')[0]
      allDates.push(date)
    }

    // 创建打卡状态映射
    const checkinMap = new Map()
    records?.forEach(record => {
      checkinMap.set(record.checkin_date, {
        checked: true,
        time: record.created_at
      })
    })

    // 生成日历数据
    const calendarData = allDates.map(date => {
      const checkinInfo = checkinMap.get(date)
      const dateObj = new Date(date)
      const isToday = date === new Date().toISOString().split('T')[0]
      const isPast = dateObj < new Date(new Date().toISOString().split('T')[0])
      
      return {
        date,
        day: dateObj.getDate(),
        weekday: dateObj.getDay(),
        isToday,
        isPast,
        isChecked: !!checkinInfo,
        checkinTime: checkinInfo?.time || null
      }
    })

    // 计算统计数据
    const totalDays = daysInMonth
    const checkedDays = records?.length || 0
    const checkinRate = totalDays > 0 ? Math.round((checkedDays / totalDays) * 100) : 0

    // 计算连续打卡天数
    let currentStreak = 0
    let maxStreak = 0
    let tempStreak = 0

    const today = getBeijingDateString()
    const sortedDates = allDates.sort().reverse() // 从今天开始往前算

    for (const date of sortedDates) {
      if (date > today) continue // 跳过未来的日期
      
      if (checkinMap.has(date)) {
        tempStreak++
        if (date === today || (currentStreak === 0 && date < today)) {
          currentStreak = tempStreak
        }
      } else {
        if (currentStreak === 0) {
          currentStreak = tempStreak
        }
        tempStreak = 0
      }
      
      maxStreak = Math.max(maxStreak, tempStreak)
    }

    console.log(`✅ [Checkin Stats API] 统计完成: ${checkedDays}/${totalDays} 天`)

    return NextResponse.json({
      success: true,
      stats: {
        year,
        month,
        totalDays,
        checkedDays,
        checkinRate,
        currentStreak,
        maxStreak
      },
      calendar: calendarData
    })

  } catch (error: any) {
    console.error('Checkin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
