import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始检查AXCF202505测试数据...')

    const analysis = {
      timestamp: new Date().toISOString(),
      data: {} as any
    }

    // 1. 检查AXCF202505的打卡安排数据
    const { data: schedules, error: schedulesError } = await supabase
      .from('checkin_schedules')
      .select('*')
      .like('student_id', 'AXCF202505%')
      .order('student_id')

    if (schedulesError) {
      console.error('查询打卡安排失败:', schedulesError)
      return NextResponse.json({ error: schedulesError.message }, { status: 500 })
    }

    analysis.data.schedules = {
      count: schedules?.length || 0,
      records: schedules || []
    }

    // 2. 检查AXCF202505的打卡记录数据
    const { data: records, error: recordsError } = await supabase
      .from('checkin_records')
      .select('student_id, checkin_date, xhs_url, status')
      .like('student_id', 'AXCF202505%')
      .order('student_id')

    if (recordsError) {
      console.error('查询打卡记录失败:', recordsError)
      return NextResponse.json({ error: recordsError.message }, { status: 500 })
    }

    analysis.data.records = {
      count: records?.length || 0,
      records: records || []
    }

    // 3. 统计每个学员的记录数
    const studentStats: { [key: string]: { schedules: number, records: number } } = {}

    // 统计打卡安排
    schedules?.forEach(schedule => {
      if (!studentStats[schedule.student_id]) {
        studentStats[schedule.student_id] = { schedules: 0, records: 0 }
      }
      studentStats[schedule.student_id].schedules++
    })

    // 统计打卡记录
    records?.forEach(record => {
      if (!studentStats[record.student_id]) {
        studentStats[record.student_id] = { schedules: 0, records: 0 }
      }
      studentStats[record.student_id].records++
    })

    analysis.data.studentStats = studentStats

    // 4. 检查学员账户信息（确保不会误删账户）
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('student_id, name, real_name, role, created_at')
      .like('student_id', 'AXCF202505%')
      .order('student_id')

    if (usersError) {
      console.error('查询学员账户失败:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    analysis.data.users = {
      count: users?.length || 0,
      accounts: users || []
    }

    // 5. 生成清理建议
    const suggestions = []

    if (analysis.data.schedules.count > 0) {
      suggestions.push(`发现 ${analysis.data.schedules.count} 条AXCF202505的打卡安排，建议删除以便学员重新自主设置`)
    }

    if (analysis.data.records.count > 0) {
      suggestions.push(`发现 ${analysis.data.records.count} 条AXCF202505的打卡记录，建议一并清理`)
    }

    if (analysis.data.users.count > 0) {
      suggestions.push(`保留 ${analysis.data.users.count} 个AXCF202505学员账户，不要删除`)
    }

    analysis.data.suggestions = suggestions

    console.log('AXCF202505数据分析完成:', analysis)

    return NextResponse.json({
      success: true,
      message: 'AXCF202505数据检查完成',
      ...analysis
    })

  } catch (error) {
    console.error('🚨 检查AXCF202505数据时出错:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 开始清理AXCF202505测试数据...')

    const results = {
      timestamp: new Date().toISOString(),
      operations: [] as any[]
    }

    // 1. 删除打卡记录
    const { data: deletedRecords, error: recordsError } = await supabase
      .from('checkin_records')
      .delete()
      .like('student_id', 'AXCF202505%')
      .select()

    results.operations.push({
      operation: 'delete_checkin_records',
      success: !recordsError,
      deletedCount: deletedRecords?.length || 0,
      error: recordsError?.message || null
    })

    if (recordsError) {
      console.error('删除打卡记录失败:', recordsError)
    } else {
      console.log(`✅ 删除了 ${deletedRecords?.length || 0} 条AXCF202505打卡记录`)
    }

    // 2. 删除打卡安排
    const { data: deletedSchedules, error: schedulesError } = await supabase
      .from('checkin_schedules')
      .delete()
      .like('student_id', 'AXCF202505%')
      .select()

    results.operations.push({
      operation: 'delete_checkin_schedules',
      success: !schedulesError,
      deletedCount: deletedSchedules?.length || 0,
      error: schedulesError?.message || null
    })

    if (schedulesError) {
      console.error('删除打卡安排失败:', schedulesError)
    } else {
      console.log(`✅ 删除了 ${deletedSchedules?.length || 0} 条AXCF202505打卡安排`)
    }

    // 3. 验证清理结果
    const { data: remainingSchedules } = await supabase
      .from('checkin_schedules')
      .select('count')
      .like('student_id', 'AXCF202505%')

    const { data: remainingRecords } = await supabase
      .from('checkin_records')
      .select('count')
      .like('student_id', 'AXCF202505%')

    const { data: remainingUsers } = await supabase
      .from('users')
      .select('count')
      .like('student_id', 'AXCF202505%')

    results.operations.push({
      operation: 'verification',
      remainingSchedules: remainingSchedules?.length || 0,
      remainingRecords: remainingRecords?.length || 0,
      remainingUsers: remainingUsers?.length || 0
    })

    console.log('AXCF202505数据清理完成:', results)

    return NextResponse.json({
      success: true,
      message: 'AXCF202505测试数据清理完成',
      ...results
    })

  } catch (error) {
    console.error('🚨 清理AXCF202505数据时出错:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}