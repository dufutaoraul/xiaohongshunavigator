import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 验证学员身份
async function verifyStudentAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }

  try {
    const studentId = authHeader.replace('Bearer ', '')
    
    const { data: user, error } = await supabase
      .from('users')
      .select('student_id, name, can_self_schedule, has_used_self_schedule, self_schedule_deadline, created_at')
      .eq('student_id', studentId)
      .single()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    return null
  }
}

// 计算93天后的日期
function calculateEndDate(startDate: string): string {
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(start.getDate() + 92) // 93天包含开始日期，所以加92天
  return end.toISOString().split('T')[0]
}

// 获取北京时间的今天日期
function getBeijingToday(): string {
  const now = new Date()
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)) // UTC+8
  return beijingTime.toISOString().split('T')[0]
}

// GET: 获取学员自主设定状态
export async function GET(request: NextRequest) {
  try {
    const user = await verifyStudentAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = getBeijingToday()
    const createdAt = new Date(user.created_at)
    const deadline = new Date(user.self_schedule_deadline)
    const deadlineStr = deadline.toISOString().split('T')[0]

    // 检查是否有自主设定权限
    if (!user.can_self_schedule) {
      return NextResponse.json({ 
        can_self_schedule: false,
        message: '您没有自主设定打卡时间的权限'
      })
    }

    // 检查是否已使用过设定机会
    if (user.has_used_self_schedule) {
      // 查询已设定的打卡安排
      const { data: schedule, error } = await supabase
        .from('checkin_schedules')
        .select('start_date, end_date')
        .eq('student_id', user.student_id)
        .eq('schedule_type', 'self_set')
        .eq('is_active', true)
        .single()

      return NextResponse.json({ 
        can_self_schedule: true,
        has_used_opportunity: true,
        current_schedule: schedule,
        message: '您已设置过打卡时间，不可再次修改'
      })
    }

    // 检查是否超过设定截止时间
    if (today > deadlineStr) {
      return NextResponse.json({ 
        can_self_schedule: true,
        has_used_opportunity: false,
        is_expired: true,
        deadline: deadlineStr,
        message: '您需要在买课后的半年内开启打卡，设定时间已过期'
      })
    }

    // 计算可选择的日期范围
    const earliestDate = today // 最早只能选今天
    const latestDate = deadlineStr // 最晚是截止日期

    return NextResponse.json({ 
      can_self_schedule: true,
      has_used_opportunity: false,
      is_expired: false,
      date_range: {
        earliest: earliestDate,
        latest: latestDate
      },
      deadline: deadlineStr,
      message: `您可以在 ${deadlineStr} 前设置打卡开始时间，有且只有一次设置机会`
    })

  } catch (error) {
    console.error('获取自主设定状态失败:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 学员设定打卡时间
export async function POST(request: NextRequest) {
  try {
    const user = await verifyStudentAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { start_date } = body

    if (!start_date) {
      return NextResponse.json({ error: '请选择打卡开始日期' }, { status: 400 })
    }

    // 检查权限
    if (!user.can_self_schedule) {
      return NextResponse.json({ error: '您没有自主设定打卡时间的权限' }, { status: 403 })
    }

    // 检查是否已使用过机会
    if (user.has_used_self_schedule) {
      return NextResponse.json({ error: '您已设置过打卡时间，不可再次修改' }, { status: 403 })
    }

    const today = getBeijingToday()
    const deadline = new Date(user.self_schedule_deadline).toISOString().split('T')[0]

    // 检查是否超期
    if (today > deadline) {
      return NextResponse.json({ error: '设定时间已过期，您需要在买课后的半年内开启打卡' }, { status: 403 })
    }

    // 验证日期范围
    if (start_date < today) {
      return NextResponse.json({ error: '打卡开始日期不能早于今天' }, { status: 400 })
    }

    if (start_date > deadline) {
      return NextResponse.json({ error: '打卡开始日期不能超过设定截止时间' }, { status: 400 })
    }

    // 检查是否已有打卡安排
    const { data: existingSchedule, error: checkError } = await supabase
      .from('checkin_schedules')
      .select('id')
      .eq('student_id', user.student_id)
      .eq('is_active', true)

    if (checkError) {
      return NextResponse.json({ error: '检查现有安排失败' }, { status: 500 })
    }

    if (existingSchedule && existingSchedule.length > 0) {
      return NextResponse.json({ error: '您已有打卡安排，请联系管理员' }, { status: 409 })
    }

    // 计算结束日期（93天）
    const end_date = calculateEndDate(start_date)

    // 开始事务：创建打卡安排 + 标记已使用机会
    const { data: schedule, error: scheduleError } = await supabase
      .from('checkin_schedules')
      .insert({
        student_id: user.student_id,
        start_date,
        end_date,
        created_by: user.student_id,
        schedule_type: 'self_set',
        is_active: true
      })
      .select()
      .single()

    if (scheduleError) {
      return NextResponse.json({ error: '创建打卡安排失败' }, { status: 500 })
    }

    // 标记用户已使用自主设定机会
    const { error: updateError } = await supabase
      .from('users')
      .update({ has_used_self_schedule: true })
      .eq('student_id', user.student_id)

    if (updateError) {
      // 如果更新用户状态失败，删除刚创建的安排
      await supabase
        .from('checkin_schedules')
        .delete()
        .eq('id', schedule.id)
      
      return NextResponse.json({ error: '设置失败，请重试' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: '打卡时间设置成功！',
      schedule: {
        start_date,
        end_date,
        total_days: 93,
        required_checkins: 90
      }
    })

  } catch (error) {
    console.error('设定打卡时间失败:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
