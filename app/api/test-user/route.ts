import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, password, name } = body

    if (!student_id || !password) {
      return NextResponse.json(
        { error: 'Missing student_id or password' },
        { status: 400 }
      )
    }

    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('student_id')
      .eq('student_id', student_id)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    // 创建密码哈希
    const hashedPassword = await bcrypt.hash(password, 12)

    // 创建新用户
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        student_id,
        name: name || `学员${student_id}`,
        password_hash: hashedPassword,
        first_login: true,
        persona: '我是一个积极学习AI技术的学员',
        keywords: 'AI学习,技术分享,个人成长',
        vision: '通过90天的学习，成为AI应用专家'
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create user:', error)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      user: {
        student_id,
        name: name || `学员${student_id}`
      }
    })

  } catch (error: any) {
    console.error('Test user creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create test user', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

// GET 方法：查看现有用户
export async function GET(request: NextRequest) {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('student_id, name, created_at, first_login')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Failed to fetch users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: users || []
    })

  } catch (error: any) {
    console.error('Fetch users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
