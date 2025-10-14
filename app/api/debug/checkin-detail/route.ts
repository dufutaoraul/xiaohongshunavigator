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

    console.log(`🔍 [DEBUG] 调试学员 ${studentId} 的详细打卡数据`)

    // 获取学员的所有打卡记录
    const { data: records, error: recordsError } = await supabase
      .from('checkin_records')
      .select('*')
      .eq('student_id', studentId)
      .order('checkin_date', { ascending: true })

    if (recordsError) {
      console.error('获取打卡记录失败:', recordsError)
      return NextResponse.json(
        { error: 'Failed to fetch checkin records: ' + recordsError.message },
        { status: 500 }
      )
    }

    console.log('📝 [DEBUG] 学员所有打卡记录:', records)

    // 分析每个记录的链接字段
    const recordAnalysis = records?.map((record: any, index: number) => ({
      序号: index + 1,
      日期: record.checkin_date,
      创建时间: record.created_at,
      更新时间: record.updated_at,
      链接字段: {
        xhs_url: record.xhs_url || '空',
        xiaohongshu_url: record.xiaohongshu_url || '空',
        xiaohongshu_link: record.xiaohongshu_link || '空'
      },
      有效链接: record.xhs_url || record.xiaohongshu_url || record.xiaohongshu_link || null,
      状态: record.status || '无状态'
    })) || []

    // 统计信息
    const stats = {
      总记录数: recordAnalysis.length,
      有链接的记录数: recordAnalysis.filter(r => r.有效链接 !== null).length,
      无链接的记录数: recordAnalysis.filter(r => r.有效链接 === null).length,
      按字段统计: {
        xhs_url: recordAnalysis.filter(r => r.链接字段.xhs_url !== '空').length,
        xiaohongshu_url: recordAnalysis.filter(r => r.链接字段.xiaohongshu_url !== '空').length,
        xiaohongshu_link: recordAnalysis.filter(r => r.链接字段.xiaohongshu_link !== '空').length
      }
    }

    console.log('📊 [DEBUG] 统计信息:', stats)

    return NextResponse.json({
      success: true,
      debug_info: {
        student_id: studentId,
        统计: stats,
        详细记录: recordAnalysis
      }
    })

  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}