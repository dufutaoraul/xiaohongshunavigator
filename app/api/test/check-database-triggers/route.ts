import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始检查数据库触发器和RLS策略...')

    const diagnostics = {
      timestamp: new Date().toISOString(),
      checks: {} as any
    }

    // 1. 检查users表的触发器
    const { data: triggers, error: triggersError } = await supabase
      .rpc('check_triggers_for_users')
      .single()

    if (triggersError) {
      console.log('触发器检查失败，尝试直接SQL查询...')

      // 直接查询系统表
      const { data: systemCheck, error: systemError } = await supabase
        .from('information_schema.triggers')
        .select('*')
        .eq('event_object_table', 'users')

      if (systemError) {
        console.error('系统表查询也失败:', systemError)
        diagnostics.checks.triggers = {
          success: false,
          error: systemError.message,
          note: '无法查询触发器信息'
        }
      } else {
        diagnostics.checks.triggers = {
          success: true,
          data: systemCheck,
          count: systemCheck?.length || 0
        }
      }
    } else {
      diagnostics.checks.triggers = {
        success: true,
        data: triggers
      }
    }

    // 2. 检查RLS策略 - 尝试不同的方法
    try {
      // 方法1: 尝试查询pg_policies
      const { data: policies, error: policiesError } = await supabase
        .rpc('sql', {
          query: `
            SELECT policyname, cmd, qual, with_check
            FROM pg_policies
            WHERE tablename = 'users'
            AND schemaname = 'public'
          `
        })

      if (policiesError) {
        console.log('RLS策略查询失败:', policiesError)
        diagnostics.checks.rls_policies = {
          success: false,
          error: policiesError.message,
          note: '无法查询RLS策略'
        }
      } else {
        diagnostics.checks.rls_policies = {
          success: true,
          data: policies,
          count: policies?.length || 0
        }
      }
    } catch (rlsError) {
      console.log('RLS策略检查异常:', rlsError)
      diagnostics.checks.rls_policies = {
        success: false,
        error: rlsError instanceof Error ? rlsError.message : 'Unknown RLS error'
      }
    }

    // 3. 检查users表结构
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')

    diagnostics.checks.table_structure = {
      success: !tableError,
      error: tableError?.message || null,
      columns: tableInfo || []
    }

    // 4. 尝试简单的SELECT查询
    const { data: simpleSelect, error: selectError } = await supabase
      .from('users')
      .select('student_id, name')
      .limit(1)

    diagnostics.checks.simple_select = {
      success: !selectError,
      error: selectError?.message || null,
      hasData: !!simpleSelect?.length
    }

    // 5. 检查是否有相关的自定义函数
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_definition')
      .eq('routine_schema', 'public')
      .like('routine_definition', '%self_schedule_permissions%')

    diagnostics.checks.custom_functions = {
      success: !functionsError,
      error: functionsError?.message || null,
      functions: functions || []
    }

    console.log('数据库诊断结果:', diagnostics)

    return NextResponse.json({
      success: true,
      message: '数据库诊断完成',
      ...diagnostics
    })

  } catch (error) {
    console.error('🚨 数据库诊断出错:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}