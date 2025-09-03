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
      if (!student_ids || !Array.isArray(student_ids)) {
        return NextResponse.json({ error: 'Invalid student_ids' }, { status: 400 })
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ 
          can_self_schedule: true,
          self_schedule_deadline: supabaseAdmin.raw('created_at + INTERVAL \'6 months\'')
        })
        .in('student_id', student_ids)
        .select('student_id, name')

      if (error) {
        return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 })
      }

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

      // 1. 记录批量设置范围
      const { error: rangeError } = await supabaseAdmin
        .from('self_schedule_ranges')
        .insert({
          start_student_id,
          end_student_id,
          created_by: admin.student_id
        })

      if (rangeError) {
        return NextResponse.json({ error: 'Failed to save range' }, { status: 500 })
      }

      // 2. 为范围内现有学员开启权限
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ 
          can_self_schedule: true,
          self_schedule_deadline: supabaseAdmin.raw('created_at + INTERVAL \'6 months\'')
        })
        .gte('student_id', start_student_id)
        .lte('student_id', end_student_id)
        .select('student_id, name')

      if (error) {
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
