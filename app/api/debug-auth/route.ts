import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

// 在构建时检查环境变量
if (typeof window === 'undefined' && (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co')) {
  console.warn('Supabase URL not configured properly for build in debug-auth route')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, password } = body

    console.log('🔍 Debug Auth - Input:', { student_id, password: password ? '***' : 'empty' })

    if (!student_id || !password) {
      return NextResponse.json({
        error: 'Missing student_id or password',
        debug: { student_id: !!student_id, password: !!password }
      }, { status: 400 })
    }

    // 查询用户 - 只查询确实存在的字段
    const { data: user, error } = await supabase
      .from('users')
      .select('student_id, name, password')
      .eq('student_id', student_id)
      .single()

    console.log('🔍 Database query result:', {
      error: error?.message,
      user: user ? {
        student_id: user.student_id,
        name: user.name,
        has_password: !!user.password,
        password_length: user.password?.length || 0
      } : null
    })

    if (error || !user) {
      return NextResponse.json({
        error: 'User not found',
        debug: {
          supabase_error: error?.message,
          user_found: !!user
        }
      }, { status: 404 })
    }

    // 密码验证调试 - 只检查明文密码
    let passwordValidation = {
      input_password: password,
      db_password: user.password,
      plaintext_match: false,
      final_result: false
    }

    // 检查明文密码
    if (user.password) {
      passwordValidation.plaintext_match = user.password === password
      console.log('🔍 Plaintext password check:', {
        db_password: user.password,
        input_password: password,
        match: passwordValidation.plaintext_match
      })
    }

    passwordValidation.final_result = passwordValidation.plaintext_match

    return NextResponse.json({
      success: passwordValidation.final_result,
      user: {
        student_id: user.student_id,
        name: user.name
      },
      debug: passwordValidation
    })

  } catch (error: any) {
    console.error('🔍 Debug auth error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      debug: {
        message: error?.message,
        stack: error?.stack
      }
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug GET: Fetching users...')

    // 获取所有用户的基本信息用于调试
    const { data: users, error } = await supabase
      .from('users')
      .select('student_id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('🔍 Debug GET: Query result:', { error: error?.message, userCount: users?.length })

    if (error) {
      console.error('🔍 Debug GET: Supabase error:', error)
      return NextResponse.json({
        error: 'Failed to fetch users',
        debug: { supabase_error: error.message }
      }, { status: 500 })
    }

    const debugUsers = users?.map(user => ({
      student_id: user.student_id,
      name: user.name,
      created_at: user.created_at
    })) || []

    return NextResponse.json({
      success: true,
      users: debugUsers,
      total: users?.length || 0
    })

  } catch (error: any) {
    console.error('🔍 Debug get users error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      debug: { message: error?.message }
    }, { status: 500 })
  }
}
