import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, student_id, password, new_password } = body

    if (!student_id || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (action === 'login') {
      // 验证用户登录
      const { data: user, error } = await supabase
        .from('users')
        .select('student_id, password, persona, keywords, vision')
        .eq('student_id', student_id)
        .single()

      if (error || !user) {
        console.error('User not found:', error)
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // 检查密码
      if (user.password !== password) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // 登录成功，返回用户信息和是否需要修改密码
      const needsPasswordChange = user.password === user.student_id

      return NextResponse.json({
        success: true,
        user: {
          student_id: user.student_id,
          persona: user.persona,
          keywords: user.keywords,
          vision: user.vision
        },
        needsPasswordChange
      })

    } else if (action === 'change_password') {
      // 修改密码
      if (!new_password) {
        return NextResponse.json(
          { error: 'New password is required' },
          { status: 400 }
        )
      }

      if (new_password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        )
      }

      if (new_password === student_id) {
        return NextResponse.json(
          { error: 'New password cannot be the same as student ID' },
          { status: 400 }
        )
      }

      // 先验证当前密码
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('password')
        .eq('student_id', student_id)
        .single()

      if (fetchError || !user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      if (user.password !== password) {
        return NextResponse.json(
          { error: 'Invalid current password' },
          { status: 401 }
        )
      }

      // 更新密码
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: new_password })
        .eq('student_id', student_id)

      if (updateError) {
        console.error('Password update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}