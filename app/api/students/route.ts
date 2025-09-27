import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/students - 获取所有AXCF202501开头的学员
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 正在从Supabase获取所有AXCF202501开头的学员...')

    const { data, error } = await supabase
      .from('users')
      .select('id, created_at, student_id, name, real_name, persona, keywords, vision, xiaohongshu_profile_url, role')
      .like('student_id', 'AXCF202501%')
      .not('xiaohongshu_profile_url', 'is', null)
      .not('xiaohongshu_profile_url', 'eq', '')

    if (error) {
      console.error('❌ Supabase查询错误:', error)
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ 成功获取 ${data?.length || 0} 个有效学员数据`)
    console.log('📊 学员详情:', data?.map(u => ({
      student_id: u.student_id,
      name: u.name || u.real_name,
      has_xhs_url: !!u.xiaohongshu_profile_url
    })))

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