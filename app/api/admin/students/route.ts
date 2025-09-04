import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// 使用服务角色密钥绕过RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// 验证管理员权限
async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !supabaseAdmin) {
    return null
  }

  try {
    // 这里简化处理，实际项目中应该使用JWT或session验证
    const studentId = authHeader.replace('Bearer ', '')
    
    const { data: user, error } = await supabaseAdmin
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

// 生成学号范围的函数
function generateStudentIdRange(startId: string, endId: string): string[] {
  const studentIds: string[] = []

  // 简单的数字递增逻辑
  const startNum = parseInt(startId.replace(/\D/g, ''))
  const endNum = parseInt(endId.replace(/\D/g, ''))
  const prefix = startId.replace(/\d+$/, '')

  if (startNum && endNum && startNum <= endNum) {
    for (let i = startNum; i <= endNum; i++) {
      studentIds.push(prefix + i.toString().padStart(startId.replace(/\D/g, '').length, '0'))
    }
  }

  return studentIds
}

// GET - 获取所有学员列表
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 });
    }

    // 暂时跳过权限验证，后续可以加上
    // const admin = await verifyAdminAuth(request)
    // if (!admin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('🔍 [学员列表] 开始获取学员数据...')

    // 获取所有学员基本信息
    const { data: students, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        student_id,
        name,
        real_name,
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

    console.log(`📊 [学员列表] 获取到 ${students?.length || 0} 个学员`)

    // 获取所有活跃的打卡安排
    const { data: schedules, error: schedulesError } = await supabaseAdmin
      .from('checkin_schedules')
      .select('*')
      .eq('is_active', true)

    if (schedulesError) {
      console.error('Failed to fetch schedules:', schedulesError)
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      )
    }

    console.log(`📅 [学员列表] 获取到 ${schedules?.length || 0} 个活跃打卡安排`)

    // 为每个学员匹配对应的打卡安排
    const studentsWithSchedules = (students || []).map(student => {
      let matchedSchedule = null

      if (schedules && schedules.length > 0) {
        // 查找匹配的打卡安排
        for (const schedule of schedules) {
          if (schedule.student_id && !schedule.batch_start_id && !schedule.batch_end_id) {
            // 单个学员模式
            if (schedule.student_id === student.student_id) {
              matchedSchedule = schedule
              break
            }
          } else if (schedule.batch_start_id && schedule.batch_end_id) {
            // 批量模式 - 检查学员ID是否在范围内
            const batchStudentIds = generateStudentIdRange(schedule.batch_start_id, schedule.batch_end_id)
            if (batchStudentIds.includes(student.student_id)) {
              matchedSchedule = schedule
              break
            }
          }
        }
      }

      console.log(`👤 [学员列表] 学员 ${student.student_id} 匹配到安排: ${matchedSchedule ? 'YES' : 'NO'}`)

      return {
        ...student,
        schedule: matchedSchedule
      }
    })

    console.log(`✅ [学员列表] 完成学员数据处理，返回 ${studentsWithSchedules.length} 个学员`)

    return NextResponse.json({
      success: true,
      students: studentsWithSchedules
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
    if (!supabaseAdmin) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 });
    }

    // 暂时跳过权限验证
    // const admin = await verifyAdminAuth(request)
    // if (!admin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { student_id, name, real_name, role = 'student' } = body

    console.log('创建学员请求:', { student_id, name, real_name: !!real_name, role });

    // 验证必填字段
    if (!student_id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, name' },
        { status: 400 }
      )
    }

    // 新增学员的初始密码默认为学号
    const defaultPassword = student_id

    // 检查学号是否已存在
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('student_id')
      .eq('student_id', student_id)
      .single()

    if (existingUser) {
      console.log('学号已存在:', student_id);
      return NextResponse.json(
        { error: 'Student ID already exists' },
        { status: 409 }
      )
    }

    // 加密密码（使用学号作为初始密码）
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    // 创建新用户
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        student_id,
        name,
        real_name,
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
        real_name: newUser.real_name,
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
    if (!supabaseAdmin) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 });
    }

    // 暂时跳过权限验证
    // const admin = await verifyAdminAuth(request)
    // if (!admin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { student_id, name, real_name, role, password } = body

    if (!student_id) {
      return NextResponse.json(
        { error: 'Missing student_id' },
        { status: 400 }
      )
    }

    // 准备更新数据
    const updateData: any = {}
    if (name) updateData.name = name
    if (real_name !== undefined) updateData.real_name = real_name
    if (role) updateData.role = role

    // 如果提供了新密码，进行加密
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    console.log('更新学员信息:', { student_id, updateData })

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('student_id', student_id)
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
        real_name: updatedUser.real_name,
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