import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // 检查环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const envCheck = {
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey,
      supabaseUrlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT_SET',
      anonKeyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT_SET',
      serviceKeyPreview: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'NOT_SET'
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        envCheck
      })
    }

    // 测试连接
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // 尝试简单查询
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    return NextResponse.json({
      success: true,
      envCheck,
      connectionTest: {
        success: !error,
        error: error?.message,
        data
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, student_id } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing service role key'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (action === 'test_user_query') {
      // 测试用户查询
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5)

      const { data: specificUser, error: specificError } = await supabase
        .from('users')
        .select('*')
        .eq('student_id', student_id)
        .single()

      return NextResponse.json({
        success: true,
        allUsersQuery: {
          success: !usersError,
          error: usersError?.message,
          count: users?.length || 0,
          users: users?.map(u => ({ student_id: u.student_id, name: u.name })) || []
        },
        specificUserQuery: {
          success: !specificError,
          error: specificError?.message,
          user: specificUser ? {
            student_id: specificUser.student_id,
            name: specificUser.name,
            hasPassword: !!specificUser.password,
            passwordLength: specificUser.password?.length || 0,
            passwordPreview: specificUser.password ? `${specificUser.password.substring(0, 8)}...` : 'NO_PASSWORD'
          } : null
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}