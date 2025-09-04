import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { student_id, checkin_time } = await request.json()

    if (!student_id || !checkin_time) {
      return NextResponse.json(
        { error: '学生ID和打卡时间不能为空' },
        { status: 400 }
      )
    }

    // 检查是否已存在记录
    const { data: existingRecord } = await supabase
      .from('self_schedule_settings')
      .select('*')
      .eq('student_id', student_id)
      .single()

    if (existingRecord) {
      // 更新现有记录
      const { error } = await supabase
        .from('self_schedule_settings')
        .update({
          checkin_time,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', student_id)

      if (error) {
        console.error('更新自主排期设置失败:', error)
        return NextResponse.json(
          { error: '更新设置失败' },
          { status: 500 }
        )
      }
    } else {
      // 创建新记录
      const { error } = await supabase
        .from('self_schedule_settings')
        .insert({
          student_id,
          checkin_time,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('创建自主排期设置失败:', error)
        return NextResponse.json(
          { error: '创建设置失败' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('设置自主排期失败:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const student_id = searchParams.get('student_id')

    if (!student_id) {
      return NextResponse.json(
        { error: '学生ID不能为空' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('self_schedule_settings')
      .select('*')
      .eq('student_id', student_id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('获取自主排期设置失败:', error)
      return NextResponse.json(
        { error: '获取设置失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('获取自主排期设置失败:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
