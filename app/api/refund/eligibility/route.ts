import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RefundEligibilityRequest {
  student_id: string
  window_days?: number // 检查窗口期，默认93天
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const student_id = searchParams.get('student_id')
    const window_days = parseInt(searchParams.get('window_days') || '93')

    if (!student_id) {
      return NextResponse.json(
        { error: 'Missing student_id parameter' },
        { status: 400 }
      )
    }

    console.log(`🔍 [Refund] 检查学员 ${student_id} 的退款资格，窗口期: ${window_days}天`)

    // 计算窗口期
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - window_days)

    const windowStart = startDate.toISOString().split('T')[0]
    const windowEnd = endDate.toISOString().split('T')[0]

    console.log(`📅 [Refund] 检查期间: ${windowStart} 到 ${windowEnd}`)

    // 获取窗口期内的打卡记录
    const { data: checkins, error: checkinError } = await supabase
      .from('xhs_checkins')
      .select('date, passed')
      .eq('student_id', student_id)
      .gte('date', windowStart)
      .lte('date', windowEnd)
      .order('date', { ascending: true })

    if (checkinError) {
      console.error('Failed to fetch checkin records:', checkinError)
      return NextResponse.json(
        { error: 'Failed to fetch checkin records' },
        { status: 500 }
      )
    }

    // 统计合格天数
    const passedDays = checkins?.filter(c => c.passed).length || 0
    const totalCheckinDays = checkins?.length || 0
    
    // 判断是否符合退款条件（90天或以上合格）
    const eligible = passedDays >= 90
    
    console.log(`📊 [Refund] 统计结果: 总打卡${totalCheckinDays}天, 合格${passedDays}天, 符合退款条件: ${eligible}`)

    // 检查是否已经有退款申请记录
    const { data: existingRequest, error: requestError } = await supabase
      .from('xhs_refund_requests')
      .select('*')
      .eq('student_id', student_id)
      .eq('window_start', windowStart)
      .eq('window_end', windowEnd)
      .single()

    if (requestError && requestError.code !== 'PGRST116') {
      console.error('Failed to check existing refund request:', requestError)
    }

    let refundRequestId = null

    // 如果符合条件且没有现有申请，创建退款申请记录
    if (eligible && !existingRequest) {
      console.log(`✨ [Refund] 创建退款申请记录`)
      
      const { data: newRequest, error: insertError } = await supabase
        .from('xhs_refund_requests')
        .insert({
          student_id,
          window_start: windowStart,
          window_end: windowEnd,
          passed_days: passedDays,
          eligible: true,
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create refund request:', insertError)
      } else {
        refundRequestId = newRequest.id
        console.log(`✅ [Refund] 退款申请记录已创建，ID: ${refundRequestId}`)
      }
    } else if (existingRequest) {
      refundRequestId = existingRequest.id
      console.log(`📋 [Refund] 已存在退款申请记录，ID: ${refundRequestId}`)
    }

    // 生成详细的打卡日历
    const checkinCalendar = generateCheckinCalendar(checkins || [], windowStart, windowEnd)

    return NextResponse.json({
      success: true,
      data: {
        student_id,
        window_period: {
          start_date: windowStart,
          end_date: windowEnd,
          total_days: window_days
        },
        checkin_stats: {
          total_checkin_days: totalCheckinDays,
          passed_days: passedDays,
          failed_days: totalCheckinDays - passedDays,
          missing_days: window_days - totalCheckinDays,
          pass_rate: totalCheckinDays > 0 ? (passedDays / totalCheckinDays * 100).toFixed(1) : '0.0'
        },
        refund_eligibility: {
          eligible,
          required_days: 90,
          current_passed_days: passedDays,
          remaining_days_needed: Math.max(0, 90 - passedDays),
          message: eligible 
            ? '恭喜！您已达到退款条件（90天合格打卡）' 
            : `还需要 ${90 - passedDays} 天合格打卡才能申请退款`
        },
        refund_request: {
          exists: !!existingRequest,
          request_id: refundRequestId,
          status: existingRequest?.status || (eligible ? 'pending' : null),
          created_at: existingRequest?.requested_at || (refundRequestId ? new Date().toISOString() : null)
        },
        checkin_calendar: checkinCalendar
      }
    })

  } catch (error: any) {
    console.error('Refund eligibility check error:', error)
    return NextResponse.json(
      { error: 'Failed to check refund eligibility', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

// POST 方法：手动触发退款申请
export async function POST(request: NextRequest) {
  try {
    const body: RefundEligibilityRequest = await request.json()
    const { student_id, window_days = 93 } = body

    if (!student_id) {
      return NextResponse.json(
        { error: 'Missing student_id parameter' },
        { status: 400 }
      )
    }

    // 重定向到 GET 方法进行检查
    const url = new URL(request.url)
    url.searchParams.set('student_id', student_id)
    url.searchParams.set('window_days', window_days.toString())

    const getRequest = new NextRequest(url.toString(), {
      method: 'GET',
      headers: request.headers
    })

    return GET(getRequest)

  } catch (error: any) {
    console.error('Refund eligibility POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process refund eligibility request', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

// 生成打卡日历
function generateCheckinCalendar(checkins: any[], startDate: string, endDate: string) {
  const calendar: { [date: string]: { passed: boolean; checked_in: boolean } } = {}
  
  // 创建日期范围内的所有日期
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    calendar[dateStr] = {
      passed: false,
      checked_in: false
    }
  }
  
  // 填入实际的打卡数据
  checkins.forEach(checkin => {
    if (calendar[checkin.date]) {
      calendar[checkin.date] = {
        passed: checkin.passed,
        checked_in: true
      }
    }
  })
  
  return calendar
}
