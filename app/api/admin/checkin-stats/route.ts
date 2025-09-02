import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBeijingDateString } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting checkin statistics...')
    
    // 获取当前日期（北京时间）
    const todayStr = getBeijingDateString()
    
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
    
    // 获取所有学员信息
    const { data: allStudents, error: studentsError } = await supabase
      .from('users')
      .select('student_id, name, real_name')
      .eq('role', 'student')

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    // 获取所有打卡记录
    const { data: allRecords, error: recordsError } = await supabase
      .from('student_checkins')
      .select('student_id, checkin_date')

    if (recordsError) {
      console.error('Error fetching records:', recordsError)
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
    }

    // 计算各种状态的学员数量
    let qualifiedStudents = 0
    let notStartedStudents = 0
    let forgotStudents = 0

    console.log('开始计算学员状态...')
    console.log('活跃学员ID列表:', activeStudentIds)

    // 只统计有活跃打卡安排的学员
    for (const studentId of activeStudentIds) {
      // 找到该学员的打卡安排
      const studentSchedule = schedules.find((s: any) => {
        if (s.checkin_mode === 'single') {
          return s.student_id === studentId
        } else if (s.checkin_mode === 'batch') {
          return studentId >= s.batch_start_id && studentId <= s.batch_end_id
        }
        return false
      })

      if (!studentSchedule) {
        console.log(`学员 ${studentId} 没有找到对应的打卡安排`)
        continue
      }

      const startDate = new Date(studentSchedule.start_date)
      const endDate = new Date(studentSchedule.end_date)
      const todayDate = new Date(todayStr)

      // 获取该学员的打卡记录（只计算在打卡周期内的记录）
      const studentRecords = (allRecords || []).filter((r: any) =>
        r.student_id === studentId &&
        r.checkin_date >= studentSchedule.start_date &&
        r.checkin_date <= studentSchedule.end_date
      )

      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const checkinDays = studentRecords.length
      const completionRate = totalDays > 0 ? (checkinDays / totalDays) * 100 : 0

      console.log(`学员 ${studentId}: 总天数=${totalDays}, 已打卡=${checkinDays}, 完成率=${completionRate.toFixed(1)}%`)

      if (todayDate > endDate) {
        // 打卡期已结束，根据完成率判断
        if (completionRate >= 80) {
          qualifiedStudents++
          console.log(`学员 ${studentId}: 打卡合格（已结束）`)
        } else {
          forgotStudents++
          console.log(`学员 ${studentId}: 打卡不合格（已结束）`)
        }
      } else if (todayDate < startDate) {
        // 打卡期还未开始
        notStartedStudents++
        console.log(`学员 ${studentId}: 未开始打卡`)
      } else {
        // 打卡期进行中
        const daysSinceStart = Math.ceil((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

        if (checkinDays === 0) {
          // 还没有开始打卡
          notStartedStudents++
          console.log(`学员 ${studentId}: 未开始打卡（进行中）`)
        } else if (checkinDays < daysSinceStart) {
          // 有忘记打卡的天数
          forgotStudents++
          console.log(`学员 ${studentId}: 忘记打卡（应打卡${daysSinceStart}天，实际${checkinDays}天）`)
        } else {
          // 正常打卡中
          qualifiedStudents++
          console.log(`学员 ${studentId}: 正常打卡中`)
        }
      }
    }

    console.log('统计结果:', {
      activePunches,
      qualifiedStudents,
      notStartedStudents,
      forgotStudents
    })

    return NextResponse.json({
      success: true,
      activePunches,
      qualifiedStudents,
      notStartedStudents,
      forgotStudents,
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
