import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id } = body

    if (!student_id) {
      return NextResponse.json(
        { error: 'Missing student_id' },
        { status: 400 }
      )
    }

    // 查询用户信息用于调试
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', student_id)
      .single()

    return NextResponse.json({
      success: true,
      debug: {
        userExists: !!user,
        userData: user,
        error: error,
        hasPassword: user ? !!user.password : false,
        passwordLength: user?.password ? user.password.length : 0,
        hasRole: user ? !!user.role : false,
        roleValue: user?.role || 'undefined'
      }
    })

  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}