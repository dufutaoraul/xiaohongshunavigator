import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    diagnosis: {} as any
  }

  try {
    console.log('🔍 开始Vercel环境诊断...')

    // 1. 检查环境变量
    diagnostics.diagnosis.environmentVariables = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      anonKeyValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...',
      serviceKeyValue: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + '...'
    }

    // 2. 测试数据库连接
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      // 测试基础连接
      try {
        const { data: connectionTest, error: connectionError } = await supabase
          .from('users')
          .select('count')
          .limit(1)

        diagnostics.diagnosis.databaseConnection = {
          success: !connectionError,
          error: connectionError?.message || null,
          data: connectionTest
        }
      } catch (dbError) {
        diagnostics.diagnosis.databaseConnection = {
          success: false,
          error: dbError instanceof Error ? dbError.message : 'Unknown database error',
          data: null
        }
      }

      // 测试具体数据查询
      try {
        // 查询学员总数
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('student_id, role')
          .eq('role', 'student')

        diagnostics.diagnosis.usersQuery = {
          success: !usersError,
          error: usersError?.message || null,
          count: usersData?.length || 0
        }

        // 查询打卡安排
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('checkin_schedules')
          .select('*')
          .eq('is_active', true)

        diagnostics.diagnosis.schedulesQuery = {
          success: !schedulesError,
          error: schedulesError?.message || null,
          count: schedulesData?.length || 0
        }

        // 查询打卡记录
        const { data: recordsData, error: recordsError } = await supabase
          .from('checkin_records')
          .select('student_id, checkin_date')

        diagnostics.diagnosis.recordsQuery = {
          success: !recordsError,
          error: recordsError?.message || null,
          count: recordsData?.length || 0
        }

      } catch (queryError) {
        diagnostics.diagnosis.dataQueries = {
          success: false,
          error: queryError instanceof Error ? queryError.message : 'Unknown query error'
        }
      }
    } else {
      diagnostics.diagnosis.databaseConnection = {
        success: false,
        error: 'Missing required environment variables',
        data: null
      }
    }

    // 3. 网络和时区检查
    diagnostics.diagnosis.system = {
      platform: process.platform,
      nodeVersion: process.version,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currentTime: new Date().toISOString(),
      beijingTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    }

    console.log('诊断结果:', diagnostics)

    return NextResponse.json({
      success: true,
      ...diagnostics
    })

  } catch (error) {
    console.error('🚨 诊断过程出错:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ...diagnostics
    }, { status: 500 })
  }
}