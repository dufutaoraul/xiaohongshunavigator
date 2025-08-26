import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

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
      console.log('🔍 Login attempt for student_id:', student_id)

      // 验证用户登录 - 只查询存在的字段
      const { data: user, error } = await supabase
        .from('users')
        .select('student_id, name, password, persona, keywords, vision')
        .eq('student_id', student_id)
        .single()

      console.log('🔍 Database query result:', {
        error: error?.message,
        user: user ? {
          student_id: user.student_id,
          name: user.name,
          has_password: !!user.password
        } : null
      })

      if (error || !user) {
        console.error('User not found:', error)
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // 检查密码 - 支持旧的明文密码和新的哈希密码
      let isPasswordValid = false

      console.log('🔍 Password validation:', {
        input_password: password,
        db_password: user.password
      })

      if (user.password) {
        // 使用明文密码验证
        isPasswordValid = user.password === password
        console.log('🔍 Plaintext password check result:', isPasswordValid)
      } else {
        console.log('🔍 No password found in database')
      }

      if (!isPasswordValid) {
        console.log('🔍 Password validation failed')
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      console.log('🔍 Password validation successful')

      // 检查是否需要强制改密（简化版本）
      const needsPasswordChange = user.password === user.student_id

      return NextResponse.json({
        success: true,
        user: {
          student_id: user.student_id,
          name: user.name,
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
        .select('password, password_hash')
        .eq('student_id', student_id)
        .single()

      if (fetchError || !user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // 验证当前密码
      let isCurrentPasswordValid = false
      if (user.password_hash) {
        isCurrentPasswordValid = await bcrypt.compare(password, user.password_hash)
      } else if (user.password) {
        isCurrentPasswordValid = user.password === password
      }

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid current password' },
          { status: 401 }
        )
      }

      // 哈希新密码
      const hashedNewPassword = await bcrypt.hash(new_password, 12)

      // 更新密码
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: hashedNewPassword,
          password: null, // 清除明文密码
          first_login: false // 标记已完成首次登录
        })
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