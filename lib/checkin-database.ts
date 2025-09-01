import { supabase } from './supabase'

// 打卡记录接口定义
export interface CheckinRecord {
  id?: string
  student_id: string
  student_name: string
  checkin_date: string // YYYY-MM-DD 格式
  xiaohongshu_url: string
  content_title?: string
  content_description?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at?: string
  updated_at?: string
  admin_comment?: string
}

// 打卡统计接口
export interface CheckinStats {
  total_days: number
  consecutive_days: number
  current_month_days: number
  completion_rate: number
}

// 获取学员的打卡记录
export async function getStudentCheckins(studentId: string): Promise<CheckinRecord[]> {
  try {
    const { data, error } = await supabase
      .from('checkin_records')
      .select('*')
      .eq('student_id', studentId)
      .order('checkin_date', { ascending: false })

    if (error) {
      console.error('Error fetching checkin records:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getStudentCheckins:', error)
    return []
  }
}

// 获取指定月份的打卡记录
export async function getMonthlyCheckins(studentId: string, year: number, month: number): Promise<CheckinRecord[]> {
  try {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`

    const { data, error } = await supabase
      .from('checkin_records')
      .select('*')
      .eq('student_id', studentId)
      .gte('checkin_date', startDate)
      .lte('checkin_date', endDate)
      .order('checkin_date', { ascending: true })

    if (error) {
      console.error('Error fetching monthly checkins:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getMonthlyCheckins:', error)
    return []
  }
}

// 创建或更新打卡记录
export async function upsertCheckinRecord(record: Omit<CheckinRecord, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
  try {
    console.log('Upserting checkin record:', record)

    // 检查当天是否已经打卡
    const { data: existingRecord, error: checkError } = await supabase
      .from('checkin_records')
      .select('id')
      .eq('student_id', record.student_id)
      .eq('checkin_date', record.checkin_date)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing record:', checkError)
      return false
    }

    if (existingRecord) {
      // 更新现有记录
      const { error: updateError } = await supabase
        .from('checkin_records')
        .update({
          xhs_url: record.xiaohongshu_url, // 兼容旧字段
          xiaohongshu_url: record.xiaohongshu_url, // 新字段
          content_title: record.content_title,
          content_description: record.content_description,
          status: 'pending', // 重新提交后状态重置为待审核
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)

      if (updateError) {
        console.error('Error updating checkin record:', updateError)
        return false
      }
    } else {
      // 创建新记录
      const { error: insertError } = await supabase
        .from('checkin_records')
        .insert({
          student_id: record.student_id,
          student_name: record.student_name,
          checkin_date: record.checkin_date,
          xhs_url: record.xiaohongshu_url, // 映射到数据库的xhs_url字段
          xiaohongshu_url: record.xiaohongshu_url, // 保持新字段
          content_title: record.content_title,
          content_description: record.content_description,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error inserting checkin record:', insertError)
        return false
      }
    }

    console.log('Checkin record upserted successfully')
    return true
  } catch (error) {
    console.error('Error in upsertCheckinRecord:', error)
    return false
  }
}

// 获取打卡统计数据
export async function getCheckinStats(studentId: string): Promise<CheckinStats> {
  try {
    const { data, error } = await supabase
      .from('checkin_records')
      .select('checkin_date, status')
      .eq('student_id', studentId)
      .eq('status', 'approved')
      .order('checkin_date', { ascending: true })

    if (error) {
      console.error('Error fetching checkin stats:', error)
      return { total_days: 0, consecutive_days: 0, current_month_days: 0, completion_rate: 0 }
    }

    const records = data || []
    const totalDays = records.length

    // 计算当月打卡天数
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    const currentMonthDays = records.filter(record => {
      const recordDate = new Date(record.checkin_date)
      return recordDate.getFullYear() === currentYear && recordDate.getMonth() + 1 === currentMonth
    }).length

    // 计算连续打卡天数
    let consecutiveDays = 0
    if (records.length > 0) {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      // 从最近的记录开始计算连续天数
      const sortedRecords = records.sort((a, b) => new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime())
      
      // 检查今天或昨天是否有打卡
      if (sortedRecords[0] && (sortedRecords[0].checkin_date === todayStr || sortedRecords[0].checkin_date === yesterdayStr)) {
        let currentDate = new Date(sortedRecords[0].checkin_date)
        consecutiveDays = 1
        
        for (let i = 1; i < sortedRecords.length; i++) {
          const prevDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000)
          const recordDate = new Date(sortedRecords[i].checkin_date)
          
          if (recordDate.toISOString().split('T')[0] === prevDate.toISOString().split('T')[0]) {
            consecutiveDays++
            currentDate = recordDate
          } else {
            break
          }
        }
      }
    }

    // 计算完成率（假设目标是90天）
    const targetDays = 90
    const completionRate = Math.min((totalDays / targetDays) * 100, 100)

    return {
      total_days: totalDays,
      consecutive_days: consecutiveDays,
      current_month_days: currentMonthDays,
      completion_rate: Math.round(completionRate * 100) / 100
    }
  } catch (error) {
    console.error('Error in getCheckinStats:', error)
    return { total_days: 0, consecutive_days: 0, current_month_days: 0, completion_rate: 0 }
  }
}

// 检查指定日期是否可以修改打卡记录
export function canModifyCheckin(checkinDate: string): boolean {
  const today = new Date()
  const checkinDateObj = new Date(checkinDate)
  const todayStr = today.toISOString().split('T')[0]
  
  // 只有当天的打卡记录可以修改
  return checkinDate === todayStr
}
