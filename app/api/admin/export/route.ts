import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - 导出数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'checkin_records'
    const format = searchParams.get('format') || 'json'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    console.log('🔍 [Admin Export API] 导出数据:', { type, format, startDate, endDate })

    let data: any[] = []
    let filename = ''

    switch (type) {
      case 'checkin_records':
        // 导出打卡记录
        let query = supabase
          .from('checkin_records')
          .select('*')
          .order('checkin_date', { ascending: false })

        if (startDate) {
          query = query.gte('checkin_date', startDate)
        }
        if (endDate) {
          query = query.lte('checkin_date', endDate)
        }

        const { data: records, error: recordsError } = await query
        if (recordsError) throw recordsError

        data = records || []
        filename = `checkin_records_${new Date().toISOString().split('T')[0]}`
        break

      case 'students':
        // 导出学员信息
        const { data: students, error: studentsError } = await supabase
          .from('users')
          .select('student_id, name, real_name, role, xiaohongshu_profile_url, created_at')
          .eq('role', 'student')
          .order('student_id')

        if (studentsError) throw studentsError

        data = students || []
        filename = `students_${new Date().toISOString().split('T')[0]}`
        break

      case 'checkin_schedules':
        // 导出打卡安排
        const { data: schedules, error: schedulesError } = await supabase
          .from('checkin_schedules')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (schedulesError) throw schedulesError

        data = schedules || []
        filename = `checkin_schedules_${new Date().toISOString().split('T')[0]}`
        break

      case 'statistics':
        // 导出统计数据
        const { data: stats, error: statsError } = await supabase
          .from('checkin_records')
          .select('student_id, checkin_date, status')
          .order('student_id')

        if (statsError) throw statsError

        // 按学员统计
        const studentStats: { [key: string]: any } = {}
        stats?.forEach(record => {
          if (!studentStats[record.student_id]) {
            studentStats[record.student_id] = {
              student_id: record.student_id,
              total_checkins: 0,
              valid_checkins: 0,
              pending_checkins: 0,
              invalid_checkins: 0
            }
          }
          studentStats[record.student_id].total_checkins++
          if (record.status === 'valid') studentStats[record.student_id].valid_checkins++
          if (record.status === 'pending') studentStats[record.student_id].pending_checkins++
          if (record.status === 'invalid') studentStats[record.student_id].invalid_checkins++
        })

        data = Object.values(studentStats)
        filename = `statistics_${new Date().toISOString().split('T')[0]}`
        break

      default:
        return NextResponse.json({
          success: false,
          error: '不支持的导出类型'
        }, { status: 400 })
    }

    console.log('✅ [Admin Export API] 导出数据数量:', data.length)

    if (format === 'csv') {
      // 转换为CSV格式
      if (data.length === 0) {
        return new NextResponse('没有数据可导出', {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}.csv"`
          }
        })
      }

      const headers = Object.keys(data[0]).join(',')
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(',')
      )
      const csv = [headers, ...rows].join('\n')

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      })
    } else {
      // 返回JSON格式
      return NextResponse.json({
        success: true,
        data,
        total: data.length,
        filename: `${filename}.json`
      })
    }

  } catch (error) {
    console.error('❌ [Admin Export API] 导出失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
