import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// 验证管理员权限
async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }

  try {
    // 这里简化处理，实际项目中应该使用JWT或session验证
    const studentId = authHeader.replace('Bearer ', '')
    
    const { data: user, error } = await supabase
      .from('users')
      .select('student_id, name, role')
      .eq('student_id', studentId)
      .single()

    if (error || !user || user.role !== 'admin') {
      return null
    }

    return user
  } catch (error) {
    return null
  }
}

// GET - 获取所有学员列表
export async function GET(request: NextRequest) {
  try {
    // 暂时跳过权限验证，后续可以加上
    // const admin = await verifyAdminAuth(request)
    // if (!admin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { data: students, error } = await supabase
      .from('users')
      .select(`
        id,
        student_id,
        name,
        email,
        role,
        created_at,
        persona,
        keywords,
        vision
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch students:', error)
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      students: students || []
    })

  } catch (error) {
    console.error('Students API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 创建新学员
export async function POST(request: NextRequest) {
  try {
    // 暂时跳过权限验证
    // const admin = await verifyAdminAuth(request)
    // if (!admin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { student_id, name, email, password, role = 'student' } = body

    // 验证必填字段
    if (!student_id || !name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, name, password' },
        { status: 400 }
      )
    }

    // 检查学号是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('student_id')
      .eq('student_id', student_id)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Student ID already exists' },
        { status: 409 }
      )
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建新用户
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        student_id,
        name,
        email,
        password: hashedPassword,
        role
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create student:', insertError)
      return NextResponse.json(
        { error: 'Failed to create student' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      student: {
        id: newUser.id,
        student_id: newUser.student_id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at
      }
    })

  } catch (error) {
    console.error('Create student API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - 更新学员信息
export async function PUT(request: NextRequest) {
  try {
    // 暂时跳过权限验证
    // const admin = await verifyAdminAuth(request)
    // if (!admin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { id, student_id, name, email, role, password } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing student ID' },
        { status: 400 }
      )
    }

    // 准备更新数据
    const updateData: any = {}
    if (student_id) updateData.student_id = student_id
    if (name) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role) updateData.role = role
    
    // 如果提供了新密码，进行加密
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update student:', updateError)
      return NextResponse.json(
        { error: 'Failed to update student' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      student: {
        id: updatedUser.id,
        student_id: updatedUser.student_id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        created_at: updatedUser.created_at
      }
    })

  } catch (error) {
    console.error('Update student API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}