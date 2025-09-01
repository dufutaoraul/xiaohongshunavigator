import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode, student_id, batch_start_id, batch_end_id, start_date, created_by } = body

    if (!start_date || !created_by) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: start_date, created_by'
      }, { status: 400 })
    }

    // 计算结束日期（开始日期 + 92天，因为包含开始日期本身，所以93天周期是+92）
    const startDateObj = new Date(start_date + 'T00:00:00.000Z')
    const endDateObj = new Date(startDateObj.getTime() + (92 * 24 * 60 * 60 * 1000))

    const end_date = endDateObj.toISOString().split('T')[0]

    if (mode === 'single') {
      if (!student_id) {
        return NextResponse.json({
          success: false,
          error: 'Missing student_id for single mode'
        }, { status: 400 })
      }

      // 单个学员设置
      const { data, error } = await supabase
        .from('checkin_schedules')
        .upsert({
          student_id,
          start_date,
          end_date,
          created_by,
          is_active: true
        }, {
          onConflict: 'student_id,start_date'
        })
        .select()

      if (error) {
        console.error('Error setting single checkin schedule:', error)
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `成功为学员 ${student_id} 设置打卡时间：${start_date} 至 ${end_date}`,
        data: data
      })

    } else if (mode === 'batch') {
      if (!batch_start_id || !batch_end_id) {
        return NextResponse.json({
          success: false,
          error: 'Missing batch_start_id or batch_end_id for batch mode'
        }, { status: 400 })
      }

      // 批量设置 - 生成学号范围
      const studentIds = generateStudentIdRange(batch_start_id, batch_end_id)
      
      if (studentIds.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Invalid student ID range'
        }, { status: 400 })
      }

      // 批量插入
      const schedules = studentIds.map(id => ({
        student_id: id,
        start_date,
        end_date,
        created_by,
        is_active: true
      }))

      const { data, error } = await supabase
        .from('checkin_schedules')
        .upsert(schedules, {
          onConflict: 'student_id,start_date'
        })
        .select()

      if (error) {
        console.error('Error setting batch checkin schedule:', error)
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `成功为 ${studentIds.length} 个学员设置打卡时间：${start_date} 至 ${end_date}`,
        data: data,
        student_ids: studentIds
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid mode. Must be "single" or "batch"'
    }, { status: 400 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 生成学号范围的辅助函数
function generateStudentIdRange(startId: string, endId: string): string[] {
  const studentIds: string[] = []
  
  // 提取前缀和数字部分
  const startMatch = startId.match(/^([A-Z]+)(\d+)$/)
  const endMatch = endId.match(/^([A-Z]+)(\d+)$/)
  
  if (!startMatch || !endMatch) {
    return []
  }
  
  const [, startPrefix, startNumStr] = startMatch
  const [, endPrefix, endNumStr] = endMatch
  
  // 前缀必须相同
  if (startPrefix !== endPrefix) {
    return []
  }
  
  const startNum = parseInt(startNumStr, 10)
  const endNum = parseInt(endNumStr, 10)
  const numLength = startNumStr.length
  
  // 生成范围内的所有学号
  for (let i = startNum; i <= endNum; i++) {
    const paddedNum = i.toString().padStart(numLength, '0')
    studentIds.push(`${startPrefix}${paddedNum}`)
  }
  
  return studentIds
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const student_id = searchParams.get('student_id')

    if (student_id) {
      // 查询特定学员的打卡安排
      const { data, error } = await supabase
        .from('checkin_schedules')
        .select('*')
        .eq('student_id', student_id)
        .eq('is_active', true)
        .order('start_date', { ascending: false })

      if (error) {
        console.error('Error fetching checkin schedule:', error)
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: data
      })
    } else {
      // 查询所有打卡安排
      const { data, error } = await supabase
        .from('checkin_schedules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching all checkin schedules:', error)
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: data
      })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
