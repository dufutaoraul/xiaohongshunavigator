import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting checkin statistics...')
    
    // 获取当前日期
    const today = new Date()
    const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
    const todayStr = localToday.toISOString().split('T')[0]
    
    console.log('今天日期:', todayStr)
    
    // 获取所有活跃的打卡安排
    const { data: schedules, error: schedulesError } = await supabase
      .from('checkin_schedules')
      .select('*')
      .eq('is_active', true)
    
    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError)
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
    }
    
    console.log('活跃的打卡安排:', schedules)
    
    // 计算正在打卡的人数（今天在打卡周期内的学员）
    let activePunches = 0
    const activeStudentIds: string[] = []
    
    if (schedules && schedules.length > 0) {
      for (const schedule of schedules) {
        if (schedule.start_date <= todayStr && schedule.end_date >= todayStr) {
          // 这个安排在今天是活跃的
          if (schedule.checkin_mode === 'single' && schedule.student_id) {
            activePunches += 1
            activeStudentIds.push(schedule.student_id)
          } else if (schedule.checkin_mode === 'batch' && schedule.batch_start_id && schedule.batch_end_id) {
            // 批量模式，需要计算范围内的学员数量
            const { data: batchStudents, error: batchError } = await supabase
              .from('students')
              .select('student_id')
              .gte('student_id', schedule.batch_start_id)
              .lte('student_id', schedule.batch_end_id)
            
            if (!batchError && batchStudents) {
              activePunches += batchStudents.length
              activeStudentIds.push(...batchStudents.map(s => s.student_id))
            }
          }
        }
      }
    }
    
    console.log('正在打卡人数:', activePunches)
    console.log('正在打卡的学员ID:', activeStudentIds)
    
    // 计算打卡合格和不合格人数
    // 这里需要根据具体的合格标准来计算，暂时设为0
    const qualifiedStudents = 0
    const unqualifiedStudents = 0
    
    return NextResponse.json({
      success: true,
      activePunches,
      qualifiedStudents,
      unqualifiedStudents,
      activeStudentIds,
      todayStr
    })
    
  } catch (error) {
    console.error('🚨 Error getting checkin statistics:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get checkin statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
