import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// 使用服务角色密钥创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
        .select('student_id, name, password, persona, keywords, vision, role')
        .eq('student_id', student_id)
        .single()

      if (error || !user) {
        console.error('User not found:', error)
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // 检查密码 - 支持旧的明文密码和新的加密密码
      let passwordValid = false
      
      // 如果密码以$2a$或$2b$开头，说明是bcrypt加密的
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        passwordValid = await bcrypt.compare(password, user.password)
      } else {
        // 兼容旧的明文密码
        passwordValid = user.password === password
      }
      
      if (!passwordValid) {
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
          name: user.name,
          role: user.role || 'student',
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

      // 加密新密码
      const hashedPassword = await bcrypt.hash(new_password, 10)
      
      // 更新密码
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
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