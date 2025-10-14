import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/students/list - 获取学员列表
export async function GET(request: NextRequest) {
  try {
    console.log('📋 获取学员列表...')

    const { data, error } = await supabase
      .from('users')
      .select('id, created_at, student_id, name, real_name, persona, keywords, vision, role')
      .like('student_id', 'AXCF202501%')
      .order('student_id', { ascending: true })

    if (error) {
      console.error('获取学员列表失败:', error)
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ 成功获取 ${data?.length || 0} 个学员`)

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      students: data || []
    })
  } catch (error) {
    console.error('❌ API错误:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}