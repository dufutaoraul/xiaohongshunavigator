import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBeijingDateString } from '@/lib/date-utils'

// 生成学号范围的函数
function generateStudentIdRange(startId: string, endId: string): string[] {
  const studentIds: string[] = []

  // 简单的数字递增逻辑
  const startNum = parseInt(startId.replace(/\D/g, ''))
  const endNum = parseInt(endId.replace(/\D/g, ''))
  const prefix = startId.replace(/\d+$/, '')

  if (startNum && endNum && startNum <= endNum) {
    for (let i = startNum; i <= endNum; i++) {
      studentIds.push(prefix + i.toString().padStart(startId.replace(/\D/g, '').length, '0'))
    }
  }

  return studentIds
}

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
    
    // 获取所有有打卡安排的学员ID（不仅仅是当前活跃的）
    let activePunches = 0
    const allStudentIds: string[] = []
    const activeStudentIds: string[] = []

    if (schedules && schedules.length > 0) {
      for (const schedule of schedules) {
        let studentIds: string[] = []

        if (schedule.student_id && !schedule.batch_start_id && !schedule.batch_end_id) {
          // 单个学员模式
          studentIds = [schedule.student_id]
        } else if (schedule.batch_start_id && schedule.batch_end_id) {
          // 批量模式
          studentIds = generateStudentIdRange(schedule.batch_start_id, schedule.batch_end_id)
        }

        // 添加到所有学员列表（去重）
        studentIds.forEach(id => {
          if (!allStudentIds.includes(id)) {
            allStudentIds.push(id)
          }
        })

        // 检查是否在当前打卡周期内
        if (schedule.start_date <= todayStr && schedule.end_date >= todayStr) {
          activePunches += studentIds.length
          activeStudentIds.push(...studentIds)
          console.log('当前活跃的打卡安排:', schedule.student_id || `${schedule.batch_start_id}-${schedule.batch_end_id}`)
        }
      }
    }

    // 去重活跃学员ID
    const uniqueActiveStudentIds = [...new Set(activeStudentIds)]
    activePunches = uniqueActiveStudentIds.length

    console.log('所有有安排的学员数:', allStudentIds.length)
    console.log('正在打卡人数:', activePunches)
    console.log('正在打卡的学员ID:', uniqueActiveStudentIds)
    
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
      .from('checkin_records')
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
    console.log('所有学员ID列表:', allStudentIds)

    // 统计所有有打卡安排的学员（包括已结束的）
    for (const studentId of allStudentIds) {
      // 找到该学员的打卡安排（只查找单个学员模式，因为allStudentIds已经展开了批量）
      const studentSchedule = schedules.find((s: any) => s.student_id === studentId)

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
        // 打卡期已结束，使用与前端页面一致的判断标准：93天内完成90次打卡
        const actualPeriodDays = Math.min(93, totalDays)
        const isQualified = checkinDays >= 90 && actualPeriodDays >= 90

        if (isQualified) {
          qualifiedStudents++
          console.log(`学员 ${studentId}: 打卡合格（已结束，${checkinDays}天/${actualPeriodDays}天）`)
        } else {
          forgotStudents++
          console.log(`学员 ${studentId}: 打卡不合格（已结束，${checkinDays}天/${actualPeriodDays}天，需要90天）`)
        }
      } else if (todayDate < startDate) {
        // 打卡期还未开始
        notStartedStudents++
        console.log(`学员 ${studentId}: 未开始打卡`)
      } else {
        // 打卡期进行中 - 统一归类为"未开始"，与前端逻辑保持一致
        // 只有打卡期结束后才能最终判断是否合格
        notStartedStudents++
        console.log(`学员 ${studentId}: 正在打卡中（${checkinDays}天）`)
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
      activeStudentIds: uniqueActiveStudentIds,
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
