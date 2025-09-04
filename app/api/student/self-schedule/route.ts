import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 验证学员身份并自动授权AXCF202505开头的学员
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

    // 自动授权AXCF202505开头的学员
    if (studentId.startsWith('AXCF202505') && !user.can_self_schedule) {
      console.log(`自动授权学员 ${studentId} 自主设定权限`)

      // 计算截止日期：用户创建时间 + 6个月
      const createdAt = new Date(user.created_at)
      const deadline = new Date(createdAt)
      deadline.setMonth(deadline.getMonth() + 6)

      // 更新用户权限
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          can_self_schedule: true,
          self_schedule_deadline: deadline.toISOString()
        })
        .eq('student_id', studentId)
        .select('student_id, name, can_self_schedule, has_used_self_schedule, self_schedule_deadline, created_at')
        .single()

      if (updateError) {
        console.error('自动授权失败:', updateError)
        return user // 返回原用户信息
      }

      return updatedUser
    }

    return user
  } catch (error) {
    console.error('验证学员身份失败:', error)
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

    // 简化逻辑：只要users表中can_self_schedule为true，就有权限
    if (!user.can_self_schedule) {
      return NextResponse.json({
        can_self_schedule: false,
        has_used_opportunity: false,
        message: '您没有自主设定打卡时间的权限'
      })
    }

    const today = getBeijingToday()

    // 安全处理日期，避免1970年问题
    let deadlineStr = today
    if (user.self_schedule_deadline) {
      try {
        const deadline = new Date(user.self_schedule_deadline)
        if (deadline.getTime() > 0) { // 确保是有效日期
          deadlineStr = deadline.toISOString().split('T')[0]
        } else {
          // 如果日期无效，使用创建时间+6个月作为默认值
          const createdAt = new Date(user.created_at)
          const defaultDeadline = new Date(createdAt)
          defaultDeadline.setMonth(defaultDeadline.getMonth() + 6)
          deadlineStr = defaultDeadline.toISOString().split('T')[0]
        }
      } catch (error) {
        console.error('日期解析错误:', error)
        // 使用创建时间+6个月作为默认值
        const createdAt = new Date(user.created_at)
        const defaultDeadline = new Date(createdAt)
        defaultDeadline.setMonth(defaultDeadline.getMonth() + 6)
        deadlineStr = defaultDeadline.toISOString().split('T')[0]
      }
    } else {
      // 如果没有截止日期，使用创建时间+6个月
      const createdAt = new Date(user.created_at)
      const defaultDeadline = new Date(createdAt)
      defaultDeadline.setMonth(defaultDeadline.getMonth() + 6)
      deadlineStr = defaultDeadline.toISOString().split('T')[0]
    }

    // 检查是否已有任何类型的打卡安排（admin_set 或 self_set）
    const { data: existingSchedule, error: scheduleError } = await supabase
      .from('checkin_schedules')
      .select('start_date, end_date, schedule_type, created_by')
      .eq('student_id', user.student_id)
      .eq('is_active', true)
      .single()

    if (scheduleError && scheduleError.code !== 'PGRST116') {
      console.error('查询打卡安排失败:', scheduleError)
      return NextResponse.json({ error: '查询打卡安排失败' }, { status: 500 })
    }

    // 如果已有打卡安排，显示现有安排
    if (existingSchedule) {
      const scheduleTypeText = existingSchedule.schedule_type === 'self_set' ? '自主设定' : '管理员设置'
      return NextResponse.json({
        can_self_schedule: true,
        has_used_opportunity: true,
        current_schedule: existingSchedule,
        schedule_type: existingSchedule.schedule_type,
        message: `您已有打卡安排（${scheduleTypeText}），不可再次修改`
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

    // 安全处理截止日期
    let deadline = today
    if (user.self_schedule_deadline) {
      try {
        const deadlineDate = new Date(user.self_schedule_deadline)
        if (deadlineDate.getTime() > 0) {
          deadline = deadlineDate.toISOString().split('T')[0]
        } else {
          // 使用创建时间+6个月作为默认值
          const createdAt = new Date(user.created_at)
          const defaultDeadline = new Date(createdAt)
          defaultDeadline.setMonth(defaultDeadline.getMonth() + 6)
          deadline = defaultDeadline.toISOString().split('T')[0]
        }
      } catch (error) {
        console.error('日期解析错误:', error)
        const createdAt = new Date(user.created_at)
        const defaultDeadline = new Date(createdAt)
        defaultDeadline.setMonth(defaultDeadline.getMonth() + 6)
        deadline = defaultDeadline.toISOString().split('T')[0]
      }
    } else {
      // 使用创建时间+6个月作为默认值
      const createdAt = new Date(user.created_at)
      const defaultDeadline = new Date(createdAt)
      defaultDeadline.setMonth(defaultDeadline.getMonth() + 6)
      deadline = defaultDeadline.toISOString().split('T')[0]
    }

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

    // 检查是否已有任何类型的打卡安排
    const { data: existingSchedule, error: checkError } = await supabase
      .from('checkin_schedules')
      .select('id, schedule_type')
      .eq('student_id', user.student_id)
      .eq('is_active', true)

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: '检查现有安排失败' }, { status: 500 })
    }

    if (existingSchedule && existingSchedule.length > 0) {
      const scheduleTypeText = existingSchedule[0].schedule_type === 'self_set' ? '自主设定' : '管理员设置'
      return NextResponse.json({ error: `您已有打卡安排（${scheduleTypeText}），不可再次设置` }, { status: 409 })
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
