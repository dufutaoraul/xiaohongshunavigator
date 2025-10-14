import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    console.log(`🔍 [分析] 检查学员 ${studentId} 的打卡记录，区分真实数据和测试数据`)

    // 获取该学员的所有打卡记录
    const { data: records, error: recordsError } = await supabase
      .from('checkin_records')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true })

    if (recordsError) {
      console.error('获取打卡记录失败:', recordsError)
      return NextResponse.json(
        { error: 'Failed to fetch checkin records: ' + recordsError.message },
        { status: 500 }
      )
    }

    // 获取学员的打卡安排
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('checkin_schedules')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .single()

    if (scheduleError && scheduleError.code !== 'PGRST116') {
      console.error('获取打卡安排失败:', scheduleError)
    }

    // 分析每条记录，判断是否可能是测试数据
    const analyzedRecords = records?.map((record: any) => {
      const recordDate = new Date(record.checkin_date)
      const createdDate = new Date(record.created_at)

      // 计算记录创建时间和打卡时间的差异
      const timeDiff = createdDate.getTime() - recordDate.getTime()
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24)

      // 判断是否为测试数据的规则
      let isTestData = false
      let testReasons = []

      // 规则1：记录创建时间远晚于打卡时间（可能是后补的测试数据）
      if (daysDiff > 30) {
        isTestData = true
        testReasons.push(`记录创建时间比打卡时间晚${Math.round(daysDiff)}天`)
      }

      // 规则2：创建时间是工作时间或非正常时间段
      const createdHour = createdDate.getHours()
      if (createdHour >= 9 && createdHour <= 18) {
        isTestData = true
        testReasons.push(`创建时间在工作时间(${createdHour}点)`)
      }

      // 规则3：记录的分钟数是整点或半点（可能是手动设置的测试数据）
      const createdMinute = createdDate.getMinutes()
      if (createdMinute === 0 || createdMinute === 30) {
        isTestData = true
        testReasons.push(`创建时间是整点或半点(${createdMinute}分)`)
      }

      // 规则4：不在打卡周期内
      if (scheduleData) {
        const isInRange = record.checkin_date >= scheduleData.start_date &&
                         record.checkin_date <= scheduleData.end_date
        if (!isInRange) {
          isTestData = true
          testReasons.push(`打卡日期不在安排周期内`)
        }
      }

      // 规则5：链接特征分析
      const url = record.xhs_url || record.xiaohongshu_url || record.xiaohongshu_link || ''
      if (url) {
        // 测试链接通常包含某些特征
        if (url.includes('test') || url.includes('example') || url.includes('demo')) {
          isTestData = true
          testReasons.push('链接包含测试关键词')
        }
      } else {
        // 没有链接的记录很可能是测试数据
        isTestData = true
        testReasons.push('缺少小红书链接')
      }

      return {
        ...record,
        analysis: {
          isTestData,
          testReasons,
          timeDifference: {
            days: Math.round(daysDiff),
            hours: Math.round(timeDiff / (1000 * 60 * 60))
          },
          createdTime: {
            hour: createdHour,
            minute: createdMinute,
            isWorkTime: createdHour >= 9 && createdHour <= 18
          }
        }
      }
    }) || []

    // 统计信息
    const totalRecords = analyzedRecords.length
    const testRecords = analyzedRecords.filter(r => r.analysis.isTestData)
    const realRecords = analyzedRecords.filter(r => !r.analysis.isTestData)

    const stats = {
      总记录数: totalRecords,
      测试记录数: testRecords.length,
      真实记录数: realRecords.length,
      测试数据占比: totalRecords > 0 ? Math.round((testRecords.length / totalRecords) * 100) : 0,
      学员信息: {
        student_id: studentId,
        hasSchedule: !!scheduleData,
        schedule: scheduleData ? {
          start_date: scheduleData.start_date,
          end_date: scheduleData.end_date
        } : null
      }
    }

    // 常见测试原因统计
    const testReasonStats = {}
    testRecords.forEach(record => {
      record.analysis.testReasons.forEach(reason => {
        testReasonStats[reason] = (testReasonStats[reason] || 0) + 1
      })
    })

    console.log('📊 [分析结果]', {
      学员: studentId,
      统计: stats,
      测试原因统计: testReasonStats
    })

    return NextResponse.json({
      success: true,
      analysis: {
        统计信息: stats,
        测试原因统计: testReasonStats,
        详细记录: analyzedRecords,
        测试记录ID: testRecords.map(r => r.id),
        真实记录ID: realRecords.map(r => r.id)
      }
    })

  } catch (error: any) {
    console.error('数据分析API错误:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}

// 清理测试数据的API
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

    console.log(`🗑️ [清理] 开始删除学员 ${studentId} 的测试数据`)

    // 先分析数据
    const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/analyze-test-data?student_id=${studentId}`)
    const analysisData = await analysisResponse.json()

    if (!analysisData.success) {
      return NextResponse.json(
        { error: 'Failed to analyze data before deletion' },
        { status: 500 }
      )
    }

    const testRecordIds = analysisData.analysis.测试记录ID

    if (testRecordIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有找到需要删除的测试数据',
        deletedCount: 0
      })
    }

    // 删除测试数据
    const { error: deleteError } = await supabase
      .from('checkin_records')
      .delete()
      .in('id', testRecordIds)

    if (deleteError) {
      console.error('删除测试数据失败:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete test data: ' + deleteError.message },
        { status: 500 }
      )
    }

    console.log(`✅ [清理] 成功删除学员 ${studentId} 的 ${testRecordIds.length} 条测试数据`)

    return NextResponse.json({
      success: true,
      message: `成功删除 ${testRecordIds.length} 条测试数据`,
      deletedCount: testRecordIds.length,
      deletedIds: testRecordIds,
      remainingCount: analysisData.analysis.统计信息.真实记录数
    })

  } catch (error: any) {
    console.error('清理测试数据API错误:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}