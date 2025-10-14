import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 分界日期：9月25日之前的数据是测试数据
const CUTOFF_DATE = '2024-09-25'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing student_id parameter' },
        { status: 400 }
      )
    }

    console.log(`🔍 [简单分析] 检查学员 ${studentId} 在 ${CUTOFF_DATE} 之前的打卡记录`)

    // 获取该学员在分界日期之前的所有打卡记录
    const { data: oldRecords, error: oldRecordsError } = await supabase
      .from('checkin_records')
      .select('*')
      .eq('student_id', studentId)
      .lt('created_at', CUTOFF_DATE + 'T00:00:00')
      .order('created_at', { ascending: true })

    if (oldRecordsError) {
      console.error('获取旧记录失败:', oldRecordsError)
      return NextResponse.json(
        { error: 'Failed to fetch old records: ' + oldRecordsError.message },
        { status: 500 }
      )
    }

    // 获取该学员在分界日期之后的所有打卡记录（用于对比）
    const { data: newRecords, error: newRecordsError } = await supabase
      .from('checkin_records')
      .select('*')
      .eq('student_id', studentId)
      .gte('created_at', CUTOFF_DATE + 'T00:00:00')
      .order('created_at', { ascending: true })

    if (newRecordsError) {
      console.error('获取新记录失败:', newRecordsError)
      return NextResponse.json(
        { error: 'Failed to fetch new records: ' + newRecordsError.message },
        { status: 500 }
      )
    }

    console.log('📊 [查询结果]', {
      学员: studentId,
      分界日期: CUTOFF_DATE,
      旧记录数: oldRecords?.length || 0,
      新记录数: newRecords?.length || 0
    })

    return NextResponse.json({
      success: true,
      analysis: {
        分界日期: CUTOFF_DATE,
        删除说明: `将删除 ${CUTOFF_DATE} 之前创建的所有记录（测试数据）`,
        保留说明: `将保留 ${CUTOFF_DATE} 及之后创建的所有记录（真实数据）`,
        待删除记录: oldRecords || [],
        保留记录: newRecords || [],
        统计: {
          待删除记录数: oldRecords?.length || 0,
          保留记录数: newRecords?.length || 0,
          总记录数: (oldRecords?.length || 0) + (newRecords?.length || 0)
        },
        删除记录ID: oldRecords?.map(r => r.id) || []
      }
    })

  } catch (error: any) {
    console.error('简单分析API错误:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}

// 删除测试数据
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const confirmDelete = searchParams.get('confirm')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing student_id parameter' },
        { status: 400 }
      )
    }

    if (confirmDelete !== 'true') {
      return NextResponse.json(
        { error: '需要确认删除操作，请添加 confirm=true 参数' },
        { status: 400 }
      )
    }

    console.log(`🗑️ [删除] 开始删除学员 ${studentId} 在 ${CUTOFF_DATE} 之前的测试数据`)

    // 先查询要删除的数据，用于日志
    const { data: recordsToDelete, error: queryError } = await supabase
      .from('checkin_records')
      .select('*')
      .eq('student_id', studentId)
      .lt('created_at', CUTOFF_DATE + 'T00:00:00')

    if (queryError) {
      console.error('查询待删除记录失败:', queryError)
      return NextResponse.json(
        { error: 'Failed to query records to delete: ' + queryError.message },
        { status: 500 }
      )
    }

    if (!recordsToDelete || recordsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: `学员 ${studentId} 没有需要删除的测试数据`,
        deletedCount: 0
      })
    }

    // 删除操作
    const { error: deleteError } = await supabase
      .from('checkin_records')
      .delete()
      .eq('student_id', studentId)
      .lt('created_at', CUTOFF_DATE + 'T00:00:00')

    if (deleteError) {
      console.error('删除测试数据失败:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete test data: ' + deleteError.message },
        { status: 500 }
      )
    }

    // 记录删除的详细信息
    console.log(`✅ [删除完成] 学员 ${studentId}`, {
      删除记录数: recordsToDelete.length,
      删除的记录ID: recordsToDelete.map(r => r.id),
      删除记录详情: recordsToDelete.map(r => ({
        id: r.id,
        checkin_date: r.checkin_date,
        created_at: r.created_at,
        url: r.xhs_url || r.xiaohongshu_url || r.xiaohongshu_link
      }))
    })

    return NextResponse.json({
      success: true,
      message: `✅ 成功删除学员 ${studentId} 的 ${recordsToDelete.length} 条测试数据`,
      deletedCount: recordsToDelete.length,
      deletedRecords: recordsToDelete,
      cutoffDate: CUTOFF_DATE
    })

  } catch (error: any) {
    console.error('删除测试数据API错误:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}