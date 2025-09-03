import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/user?student_id={student_id}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, created_at, student_id, name, real_name, persona, keywords, vision, xiaohongshu_profile_url, role, password')
      .eq('student_id', studentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json(null)
      }
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, name, real_name, persona, keywords, vision, xiaohongshu_profile_url } = body

    if (!student_id) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      )
    }

    // 构建更新数据对象，只包含提供的字段
    const updateData: any = { student_id }
    if (name !== undefined) updateData.name = name
    if (real_name !== undefined) updateData.real_name = real_name
    if (persona !== undefined) updateData.persona = persona
    if (keywords !== undefined) updateData.keywords = keywords
    if (vision !== undefined) updateData.vision = vision
    if (xiaohongshu_profile_url !== undefined) updateData.xiaohongshu_profile_url = xiaohongshu_profile_url

    console.log('Updating user data:', updateData)

    const { data, error } = await supabase
      .from('users')
      .upsert(updateData, {
        onConflict: 'student_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save user data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/user - 更新用户信息（与POST相同逻辑）
export async function PUT(request: NextRequest) {
  return POST(request) // 复用POST方法的逻辑
}