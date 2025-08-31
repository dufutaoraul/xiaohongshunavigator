import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  getStudentCheckins,
  getMonthlyCheckins,
  upsertCheckinRecord,
  getCheckinStats,
  canModifyCheckin,
  CheckinRecord
} from '@/lib/checkin-database'

// GET /api/checkin - 获取打卡记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const type = searchParams.get('type') || 'all'

    if (!studentId) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      )
    }

    let data
    switch (type) {
      case 'monthly':
        if (!year || !month) {
          return NextResponse.json(
            { error: 'year and month are required for monthly type' },
            { status: 400 }
          )
        }
        data = await getMonthlyCheckins(studentId, parseInt(year), parseInt(month))
        break

      case 'schedule':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'start_date and end_date are required for schedule type' },
            { status: 400 }
          )
        }
        // 按日期范围查询打卡记录
        const { data: scheduleData, error } = await supabase
          .from('checkin_records')
          .select('*')
          .eq('student_id', studentId)
          .gte('checkin_date', startDate)
          .lte('checkin_date', endDate)
          .order('checkin_date', { ascending: true })

        if (error) throw error
        data = scheduleData || []
        break

      case 'stats':
        data = await getCheckinStats(studentId)
        break

      case 'all':
      default:
        data = await getStudentCheckins(studentId)
        break
    }

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('GET /api/checkin error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/checkin - 创建或更新打卡记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      student_id, 
      student_name, 
      checkin_date, 
      xiaohongshu_url, 
      content_title, 
      content_description 
    } = body

    // 验证必填字段
    if (!student_id || !student_name || !checkin_date || !xiaohongshu_url) {
      return NextResponse.json(
        { error: 'student_id, student_name, checkin_date, and xiaohongshu_url are required' },
        { status: 400 }
      )
    }

    // 验证小红书链接格式
    if (!xiaohongshu_url.includes('xiaohongshu.com') && !xiaohongshu_url.includes('xhslink.com')) {
      return NextResponse.json(
        { error: 'Invalid Xiaohongshu URL format' },
        { status: 400 }
      )
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(checkin_date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // 检查是否可以修改（只能修改当天的记录）
    if (!canModifyCheckin(checkin_date)) {
      return NextResponse.json(
        { error: 'Can only modify today\'s checkin record' },
        { status: 403 }
      )
    }

    const checkinRecord: Omit<CheckinRecord, 'id' | 'created_at' | 'updated_at'> = {
      student_id,
      student_name,
      checkin_date,
      xiaohongshu_url,
      content_title: content_title || '',
      content_description: content_description || '',
      status: 'pending'
    }

    const success = await upsertCheckinRecord(checkinRecord)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Checkin record saved successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to save checkin record' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('POST /api/checkin error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/checkin - 更新打卡记录状态（管理员用）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { record_id, status, admin_comment } = body

    if (!record_id || !status) {
      return NextResponse.json(
        { error: 'record_id and status are required' },
        { status: 400 }
      )
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, approved, or rejected' },
        { status: 400 }
      )
    }

    // 这里应该添加管理员权限验证
    // TODO: 实现管理员权限检查

    const { error } = await supabase
      .from('checkin_records')
      .update({
        status,
        admin_comment: admin_comment || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', record_id)

    if (error) {
      console.error('Error updating checkin status:', error)
      return NextResponse.json(
        { error: 'Failed to update checkin status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Checkin status updated successfully'
    })
  } catch (error) {
    console.error('PUT /api/checkin error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
