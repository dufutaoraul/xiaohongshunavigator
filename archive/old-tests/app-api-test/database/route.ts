import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Database Test] 开始测试数据库连接...')

    // 测试 users 表
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(3)

    console.log('🔍 [Database Test] users 表查询结果:', { usersData, usersError })

    // 测试可能的打卡记录表名
    const possibleTableNames = ['student_checkins', 'checkin_records', 'checkins', 'punch_records']
    let checkinsData = null
    let checkinsError = null
    let actualTableName = null

    for (const tableName of possibleTableNames) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(3)

      console.log(`🔍 [Database Test] 测试表 ${tableName}:`, { data, error })

      if (!error) {
        checkinsData = data
        checkinsError = error
        actualTableName = tableName
        break
      }
    }

    // 测试 checkin_schedules 表
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('checkin_schedules')
      .select('*')
      .limit(3)

    console.log('🔍 [Database Test] checkin_schedules 表查询结果:', { schedulesData, schedulesError })

    return NextResponse.json({
      success: true,
      data: {
        users: {
          data: usersData,
          error: usersError,
          count: usersData?.length || 0
        },
        checkin_records: {
          actualTableName,
          data: checkinsData,
          error: checkinsError,
          count: checkinsData?.length || 0
        },
        checkin_schedules: {
          data: schedulesData,
          error: schedulesError,
          count: schedulesData?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('❌ [Database Test] 测试失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
