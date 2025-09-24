import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST: 清理测试数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { confirm_cleanup } = body

    // 安全检查：需要明确确认才执行清理
    if (confirm_cleanup !== 'YES_CLEANUP_TEST_DATA') {
      return NextResponse.json({
        error: 'Missing confirmation. Please set confirm_cleanup to "YES_CLEANUP_TEST_DATA"'
      }, { status: 400 })
    }

    // 1. 首先查询即将被清理的数据
    const { data: schedulesToDelete, error: queryError } = await supabase
      .from('checkin_schedules')
      .select('id, student_id, start_date, end_date, schedule_type, created_by')
      .not('student_id', 'like', 'AXCF202501%')

    if (queryError) {
      console.error('查询待删除数据失败:', queryError)
      return NextResponse.json({ error: '查询数据失败' }, { status: 500 })
    }

    const studentIdsToReset = [...new Set(schedulesToDelete?.map(s => s.student_id) || [])]

    // 2. 查询即将被重置权限的用户
    const { data: usersToReset, error: userQueryError } = await supabase
      .from('users')
      .select('student_id, name, can_self_schedule, has_used_self_schedule')
      .in('student_id', studentIdsToReset)

    if (userQueryError) {
      console.error('查询用户数据失败:', userQueryError)
      return NextResponse.json({ error: '查询用户数据失败' }, { status: 500 })
    }

    // 3. 执行清理操作
    // 首先重置用户权限
    const { error: updateUsersError } = await supabase
      .from('users')
      .update({
        can_self_schedule: false,
        has_used_self_schedule: false,
        self_schedule_deadline: null
      })
      .in('student_id', studentIdsToReset)

    if (updateUsersError) {
      console.error('重置用户权限失败:', updateUsersError)
      return NextResponse.json({ error: '重置用户权限失败' }, { status: 500 })
    }

    // 然后删除打卡安排
    const { error: deleteSchedulesError } = await supabase
      .from('checkin_schedules')
      .delete()
      .not('student_id', 'like', 'AXCF202501%')

    if (deleteSchedulesError) {
      console.error('删除打卡安排失败:', deleteSchedulesError)
      return NextResponse.json({ error: '删除打卡安排失败' }, { status: 500 })
    }

    // 4. 验证清理结果
    const { data: remainingSchedules, error: verifyError } = await supabase
      .from('checkin_schedules')
      .select('student_id')
      .not('student_id', 'like', 'AXCF202501%')

    if (verifyError) {
      console.error('验证清理结果失败:', verifyError)
    }

    // 返回清理结果
    return NextResponse.json({
      success: true,
      message: '测试数据清理完成',
      cleanup_summary: {
        schedules_deleted: schedulesToDelete?.length || 0,
        users_reset: usersToReset?.length || 0,
        remaining_non_axcf202501_schedules: remainingSchedules?.length || 0,
        deleted_student_ids: studentIdsToReset,
        reset_users: usersToReset?.map(u => ({
          student_id: u.student_id,
          name: u.name,
          previous_can_self_schedule: u.can_self_schedule,
          previous_has_used_self_schedule: u.has_used_self_schedule
        }))
      }
    })

  } catch (error) {
    console.error('清理测试数据失败:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// GET: 查看即将被清理的数据（不执行实际清理）
export async function GET() {
  try {
    // 查询即将被删除的checkin_schedules
    const { data: schedulesToDelete, error: scheduleError } = await supabase
      .from('checkin_schedules')
      .select('id, student_id, start_date, end_date, schedule_type, created_by, is_active')
      .not('student_id', 'like', 'AXCF202501%')
      .order('student_id')

    if (scheduleError) {
      return NextResponse.json({ error: '查询打卡安排失败' }, { status: 500 })
    }

    const studentIds = [...new Set(schedulesToDelete?.map(s => s.student_id) || [])]

    // 查询即将被重置的用户
    const { data: usersToReset, error: userError } = await supabase
      .from('users')
      .select('student_id, name, can_self_schedule, has_used_self_schedule, self_schedule_deadline')
      .in('student_id', studentIds)
      .order('student_id')

    if (userError) {
      return NextResponse.json({ error: '查询用户数据失败' }, { status: 500 })
    }

    // 查看保留的AXCF202501数据
    const { data: preservedSchedules, error: preservedError } = await supabase
      .from('checkin_schedules')
      .select('id, student_id, start_date, end_date, schedule_type, created_by, is_active')
      .like('student_id', 'AXCF202501%')
      .order('student_id')

    if (preservedError) {
      return NextResponse.json({ error: '查询保留数据失败' }, { status: 500 })
    }

    return NextResponse.json({
      preview: true,
      message: '数据清理预览（未执行实际清理）',
      cleanup_preview: {
        schedules_to_delete: {
          count: schedulesToDelete?.length || 0,
          data: schedulesToDelete
        },
        users_to_reset: {
          count: usersToReset?.length || 0,
          data: usersToReset
        },
        preserved_axcf202501_schedules: {
          count: preservedSchedules?.length || 0,
          data: preservedSchedules
        }
      },
      instructions: {
        to_execute_cleanup: 'Send POST request with body: {"confirm_cleanup": "YES_CLEANUP_TEST_DATA"}',
        warning: 'This operation cannot be undone. Please review the data carefully.'
      }
    })

  } catch (error) {
    console.error('预览清理数据失败:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}