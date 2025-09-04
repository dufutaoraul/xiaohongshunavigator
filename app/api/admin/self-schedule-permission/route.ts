import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// 验证管理员权限
async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !supabaseAdmin) {
    return null
  }

  try {
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

// GET: 获取学员自主设定权限状态
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (studentId) {
      // 查询单个学员状态
      const { data: student, error } = await supabaseAdmin
        .from('users')
        .select('student_id, name, can_self_schedule, has_used_self_schedule, self_schedule_deadline, created_at')
        .eq('student_id', studentId)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      return NextResponse.json({ student })
    } else {
      // 查询所有学员的权限状态
      const { data: students, error } = await supabaseAdmin
        .from('users')
        .select('student_id, name, can_self_schedule, has_used_self_schedule, self_schedule_deadline, created_at')
        .order('student_id')

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
      }

      return NextResponse.json({ students })
    }
  } catch (error) {
    console.error('获取自主设定权限状态失败:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 设置学员自主设定权限
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, student_ids, start_student_id, end_student_id } = body

    if (action === 'set_individual') {
      // 单个设置
      console.log('处理单个设置请求:', { student_ids })

      if (!student_ids || !Array.isArray(student_ids)) {
        console.log('无效的student_ids:', student_ids)
        return NextResponse.json({ error: 'Invalid student_ids' }, { status: 400 })
      }

      if (student_ids.length === 0) {
        console.log('student_ids为空数组')
        return NextResponse.json({ error: 'No students selected' }, { status: 400 })
      }

      // 首先获取用户的创建时间，然后计算截止时间
      console.log('查询用户数据，student_ids:', student_ids)
      const { data: users, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('student_id, created_at')
        .in('student_id', student_ids)

      console.log('查询用户结果:', { users, fetchError })

      if (fetchError) {
        console.error('获取用户数据失败:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
      }

      if (!users || users.length === 0) {
        console.log('没有找到匹配的用户')
        return NextResponse.json({ error: 'No matching users found' }, { status: 404 })
      }

      // 为每个用户更新权限和截止时间
      const updatePromises = users.map(async (user) => {
        const deadline = new Date(user.created_at)
        deadline.setMonth(deadline.getMonth() + 6)

        console.log(`更新用户 ${user.student_id} 的权限，截止时间: ${deadline.toISOString()}`)

        const result = await supabaseAdmin
          .from('users')
          .update({
            can_self_schedule: true,
            self_schedule_deadline: deadline.toISOString()
          })
          .eq('student_id', user.student_id)
          .select('student_id, name')
          .single()

        console.log(`用户 ${user.student_id} 更新结果:`, result)
        return result
      })

      const results = await Promise.all(updatePromises)
      const data = results.map(result => result.data).filter(Boolean)

      // 检查是否有错误
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        console.error('更新权限时出现错误:', errors)
        return NextResponse.json({
          error: 'Failed to update permissions',
          details: errors.map(e => e.error)
        }, { status: 500 })
      }

      console.log('权限设置成功，更新的学员:', data)
      return NextResponse.json({
        success: true,
        message: `已为 ${data.length} 名学员开启自主设定权限`,
        updated_students: data
      })

    } else if (action === 'set_range') {
      // 批量范围设置
      if (!start_student_id || !end_student_id) {
        return NextResponse.json({ error: 'Invalid student ID range' }, { status: 400 })
      }

      // 为范围内现有学员开启权限
      // 首先获取范围内的用户
      const { data: rangeUsers, error: fetchRangeError } = await supabaseAdmin
        .from('users')
        .select('student_id, created_at, name')
        .gte('student_id', start_student_id)
        .lte('student_id', end_student_id)

      if (fetchRangeError) {
        return NextResponse.json({ error: 'Failed to fetch range users' }, { status: 500 })
      }

      // 为每个用户更新权限和截止时间
      const rangeUpdatePromises = rangeUsers.map(async (user) => {
        const deadline = new Date(user.created_at)
        deadline.setMonth(deadline.getMonth() + 6)

        return supabaseAdmin
          .from('users')
          .update({
            can_self_schedule: true,
            self_schedule_deadline: deadline.toISOString()
          })
          .eq('student_id', user.student_id)
          .select('student_id, name')
          .single()
      })

      const rangeResults = await Promise.all(rangeUpdatePromises)
      const data = rangeResults.map(result => result.data).filter(Boolean)

      // 检查是否有错误
      const hasRangeError = rangeResults.some(result => result.error)
      if (hasRangeError) {
        return NextResponse.json({ error: 'Failed to update range permissions' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: `已为学号范围 ${start_student_id} - ${end_student_id} 设置自主权限，当前影响 ${data.length} 名学员`,
        updated_students: data,
        range: { start_student_id, end_student_id }
      })

    } else if (action === 'remove_permission') {
      // 移除自主设定权限
      if (!student_ids || !Array.isArray(student_ids)) {
        return NextResponse.json({ error: 'Invalid student_ids' }, { status: 400 })
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ can_self_schedule: false })
        .in('student_id', student_ids)
        .select('student_id, name')

      if (error) {
        return NextResponse.json({ error: 'Failed to remove permissions' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: `已移除 ${data.length} 名学员的自主设定权限`,
        updated_students: data
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('设置自主设定权限失败:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
