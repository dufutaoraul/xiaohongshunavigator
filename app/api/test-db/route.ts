import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DB Test] 开始数据库连接测试')

    // 检查环境变量
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      isPlaceholder: process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
    }

    console.log('🔍 [DB Test] 环境变量检查:', envCheck)

    // 测试基本连接
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('student_id')
      .limit(1)

    if (testError) {
      console.error('❌ [DB Test] 数据库连接失败:', testError)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError.message,
        environment: envCheck,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    console.log('✅ [DB Test] 数据库连接成功')

    // 测试表访问权限
    const tables = ['users', 'checkin_schedules', 'checkin_records']
    const tableTests: Record<string, { accessible: boolean; error: string | null }> = {}

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .limit(1)

        tableTests[table] = {
          accessible: !error,
          error: error?.message || null
        }
      } catch (err) {
        tableTests[table] = {
          accessible: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '数据库连接测试成功',
      environment: envCheck,
      tableAccess: tableTests,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [DB Test] 测试过程中发生错误:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
