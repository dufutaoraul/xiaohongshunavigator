import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [Checkin Schedule API] 开始处理打卡日期设置请求')

    // 检查环境变量
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      actualUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
    }

    console.log('🔍 [Checkin Schedule API] 环境变量检查:', envCheck)

    // 检查是否使用了placeholder值
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'placeholder-key') {
      console.error('❌ [Checkin Schedule API] Supabase环境变量未正确配置')
      return NextResponse.json({
        success: false,
        error: 'Database configuration error',
        message: '数据库配置错误，请检查环境变量设置',
        details: 'Supabase环境变量未正确配置，请联系管理员'
      }, { status: 500 })
    }

    const body = await request.json()
    const { mode, student_id, batch_start_id, batch_end_id, start_date, created_by, force_update } = body

    console.log('🔍 [Checkin Schedule API] 请求参数:', { mode, student_id, batch_start_id, batch_end_id, start_date, created_by, force_update })

    if (!start_date || !created_by) {
      console.error('❌ [Checkin Schedule API] 缺少必要参数')
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: start_date, created_by'
      }, { status: 400 })
    }

    // 计算结束日期（开始日期 + 92天，总计93天）
    // 例如：开始日期2025-01-01，结束日期2025-04-04（第93天）
    const startDateObj = new Date(start_date + 'T00:00:00.000Z')
    const endDateObj = new Date(startDateObj.getTime() + (92 * 24 * 60 * 60 * 1000))

    const end_date = endDateObj.toISOString().split('T')[0]

    // 验证日期计算：计算实际天数
    const actualDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1
    console.log('🔍 [日期计算验证]:', {
      start_date,
      end_date,
      计算天数: actualDays,
      应该是93天: actualDays === 93
    })

    console.log('🔍 [Checkin Schedule API] 日期计算:', { start_date, end_date })

    // 测试 Supabase 连接
    console.log('🔍 [Checkin Schedule API] 测试数据库连接...')
    try {
      const { data: testData, error: testError } = await supabase
        .from('checkin_schedules')
        .select('id')
        .limit(1)

      if (testError) {
        console.error('❌ [Checkin Schedule API] 数据库连接测试失败:', testError)
        return NextResponse.json({
          success: false,
          error: 'Database connection failed',
          message: '数据库连接失败，请检查网络连接或联系管理员',
          details: testError.message,
          troubleshooting: {
            possibleCauses: [
              '网络连接问题',
              'Supabase服务暂时不可用',
              '环境变量配置错误',
              'API密钥已过期'
            ],
            solutions: [
              '检查网络连接',
              '稍后重试',
              '联系管理员检查配置'
            ]
          }
        }, { status: 500 })
      }

      console.log('✅ [Checkin Schedule API] 数据库连接正常')
    } catch (dbError) {
      console.error('❌ [Checkin Schedule API] 数据库连接异常:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database connection exception',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 })
    }

    if (mode === 'single') {
      if (!student_id) {
        return NextResponse.json({
          success: false,
          error: 'Missing student_id for single mode'
        }, { status: 400 })
      }

      // 首先验证学号是否存在于 users 表中
      console.log('🔍 [Checkin Schedule API] 验证学号是否存在:', student_id)
      const { data: userExists, error: userCheckError } = await supabase
        .from('users')
        .select('student_id, name')
        .eq('student_id', student_id)
        .maybeSingle()

      if (userCheckError) {
        console.error('❌ [Checkin Schedule API] 验证学号时发生错误:', userCheckError)
        return NextResponse.json({
          success: false,
          error: 'Failed to verify student ID: ' + userCheckError.message
        }, { status: 500 })
      }

      if (!userExists) {
        console.error('❌ [Checkin Schedule API] 学号不存在:', student_id)
        return NextResponse.json({
          success: false,
          error: 'STUDENT_NOT_FOUND',
          message: `学号 ${student_id} 不存在，请检查输入是否正确`
        }, { status: 404 })
      }

      console.log('✅ [Checkin Schedule API] 学号验证通过:', userExists.name)

      // 检查该学员是否已有打卡安排
      const { data: existingSchedule, error: checkError } = await supabase
        .from('checkin_schedules')
        .select('*')
        .eq('student_id', student_id)
        .eq('is_active', true)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing schedule:', checkError)
        return NextResponse.json({
          success: false,
          error: 'Failed to check existing schedule: ' + checkError.message
        }, { status: 500 })
      }

      if (existingSchedule && !force_update) {
        // 已存在打卡安排，返回提示信息
        return NextResponse.json({
          success: false,
          error: 'SCHEDULE_EXISTS',
          existingSchedule: {
            student_id: existingSchedule.student_id,
            start_date: existingSchedule.start_date,
            end_date: existingSchedule.end_date,
            created_at: existingSchedule.created_at
          },
          message: `学员 ${student_id} 已有打卡安排（${existingSchedule.start_date} 至 ${existingSchedule.end_date}），是否要修改？`
        }, { status: 409 })
      }

      // 单个学员设置
      let data, error
      if (existingSchedule && force_update) {
        // 强制更新现有记录
        const updateResult = await supabase
          .from('checkin_schedules')
          .update({
            start_date,
            end_date,
            created_by
          })
          .eq('id', existingSchedule.id)
          .select()

        data = updateResult.data
        error = updateResult.error
      } else {
        // 创建新记录 - 手动生成UUID以避免数据库约束错误
        const { randomUUID } = await import('crypto')
        const newId = randomUUID()

        const insertResult = await supabase
          .from('checkin_schedules')
          .insert({
            id: newId,
            student_id,
            start_date,
            end_date,
            created_by,
            is_active: true
          })
          .select()

        data = insertResult.data
        error = insertResult.error
      }

      if (error) {
        console.error('Error setting single checkin schedule:', error)
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `成功为学员 ${student_id} 设置打卡时间：${start_date} 至 ${end_date}`,
        data: data
      })

    } else if (mode === 'batch') {
      if (!batch_start_id || !batch_end_id) {
        return NextResponse.json({
          success: false,
          error: 'Missing batch_start_id or batch_end_id for batch mode'
        }, { status: 400 })
      }

      // 批量设置 - 生成学号范围
      const studentIds = generateStudentIdRange(batch_start_id, batch_end_id)

      if (studentIds.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Invalid student ID range'
        }, { status: 400 })
      }

      // 验证批量学号是否都存在于 users 表中
      console.log('🔍 [Checkin Schedule API] 验证批量学号是否存在:', studentIds)
      const { data: existingUsers, error: userCheckError } = await supabase
        .from('users')
        .select('student_id, name')
        .in('student_id', studentIds)

      if (userCheckError) {
        console.error('❌ [Checkin Schedule API] 验证批量学号时发生错误:', userCheckError)
        return NextResponse.json({
          success: false,
          error: 'Failed to verify student IDs: ' + userCheckError.message
        }, { status: 500 })
      }

      const existingUserIds = existingUsers?.map(u => u.student_id) || []
      const missingUserIds = studentIds.filter(id => !existingUserIds.includes(id))

      if (missingUserIds.length > 0) {
        console.error('❌ [Checkin Schedule API] 以下学号不存在:', missingUserIds)
        return NextResponse.json({
          success: false,
          error: 'STUDENTS_NOT_FOUND',
          message: `以下学号不存在：${missingUserIds.join(', ')}，请检查输入是否正确`,
          missingStudentIds: missingUserIds
        }, { status: 404 })
      }

      console.log('✅ [Checkin Schedule API] 批量学号验证通过，找到用户:', existingUsers?.length)

      // 检查批量学员中是否有已存在的打卡安排
      const { data: existingSchedules, error: checkError } = await supabase
        .from('checkin_schedules')
        .select('student_id, start_date, end_date')
        .in('student_id', studentIds)
        .eq('is_active', true)

      if (checkError) {
        console.error('Error checking existing batch schedules:', checkError)
        return NextResponse.json({
          success: false,
          error: 'Failed to check existing schedules: ' + checkError.message
        }, { status: 500 })
      }

      if (existingSchedules && existingSchedules.length > 0 && !force_update) {
        // 有重复的学员，返回提示信息
        const conflictStudents = existingSchedules.map(s => s.student_id).join(', ')
        return NextResponse.json({
          success: false,
          error: 'BATCH_SCHEDULE_EXISTS',
          conflictStudents: existingSchedules,
          message: `以下学员已有打卡安排：${conflictStudents}，是否要修改？`
        }, { status: 409 })
      }

      // 批量插入或更新
      let data, error
      if (existingSchedules && existingSchedules.length > 0 && force_update) {
        // 强制更新模式：先删除现有记录，再插入新记录
        await supabase
          .from('checkin_schedules')
          .delete()
          .in('student_id', studentIds)
          .eq('is_active', true)
      }

      // 为每个学员生成UUID
      const { randomUUID } = await import('crypto')
      const schedules = studentIds.map(id => ({
        id: randomUUID(),
        student_id: id,
        start_date,
        end_date,
        created_by,
        is_active: true
      }))

      const insertResult = await supabase
        .from('checkin_schedules')
        .insert(schedules)
        .select()

      data = insertResult.data
      error = insertResult.error

      if (error) {
        console.error('Error setting batch checkin schedule:', error)
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `成功为 ${studentIds.length} 个学员设置打卡时间：${start_date} 至 ${end_date}`,
        data: data,
        student_ids: studentIds
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid mode. Must be "single" or "batch"'
    }, { status: 400 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 生成学号范围的辅助函数
function generateStudentIdRange(startId: string, endId: string): string[] {
  const studentIds: string[] = []
  
  // 提取前缀和数字部分
  const startMatch = startId.match(/^([A-Z]+)(\d+)$/)
  const endMatch = endId.match(/^([A-Z]+)(\d+)$/)
  
  if (!startMatch || !endMatch) {
    return []
  }
  
  const [, startPrefix, startNumStr] = startMatch
  const [, endPrefix, endNumStr] = endMatch
  
  // 前缀必须相同
  if (startPrefix !== endPrefix) {
    return []
  }
  
  const startNum = parseInt(startNumStr, 10)
  const endNum = parseInt(endNumStr, 10)
  const numLength = startNumStr.length
  
  // 生成范围内的所有学号
  for (let i = startNum; i <= endNum; i++) {
    const paddedNum = i.toString().padStart(numLength, '0')
    studentIds.push(`${startPrefix}${paddedNum}`)
  }
  
  return studentIds
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const student_id = searchParams.get('student_id')

    if (student_id) {
      // 查询特定学员的打卡安排
      const { data, error } = await supabase
        .from('checkin_schedules')
        .select('*')
        .eq('student_id', student_id)
        .eq('is_active', true)
        .order('start_date', { ascending: false })

      if (error) {
        console.error('Error fetching checkin schedule:', error)
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: data
      })
    } else {
      // 查询所有打卡安排
      const { data, error } = await supabase
        .from('checkin_schedules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching all checkin schedules:', error)
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: data
      })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
