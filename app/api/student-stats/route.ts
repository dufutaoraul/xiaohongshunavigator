import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const student_id = searchParams.get('student_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log('📊 学员统计API请求:', { action, student_id, limit })

    switch (action) {
      case 'checkin_stats':
        // 获取打卡统计数据
        const { data: checkinStats, error: checkinError } = await supabase
          .from('checkin_records')
          .select('student_id, passed')
          .order('created_at', { ascending: false })

        if (checkinError) throw checkinError

        // 统计数据
        const stats = checkinStats.reduce((acc: any, record: any) => {
          if (!acc[record.student_id]) {
            acc[record.student_id] = { total: 0, passed: 0 }
          }
          acc[record.student_id].total++
          if (record.passed) {
            acc[record.student_id].passed++
          }
          return acc
        }, {})

        const topStudents = Object.entries(stats)
          .map(([student_id, data]: [string, any]) => ({
            student_id,
            total_checkins: data.total,
            passed_checkins: data.passed,
            pass_rate: data.total > 0 ? (data.passed / data.total * 100).toFixed(1) : '0'
          }))
          .sort((a, b) => b.passed_checkins - a.passed_checkins)
          .slice(0, limit)

        return NextResponse.json({
          success: true,
          data: topStudents,
          message: `获取前${limit}名优秀学员成功`
        })

      case 'recent_checkins':
        // 获取最新打卡记录
        const { data: recentCheckins, error: recentError } = await supabase
          .from('checkin_records')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (recentError) throw recentError

        return NextResponse.json({
          success: true,
          data: recentCheckins,
          message: `获取${limit}个最新打卡记录成功`
        })

      case 'student_checkins':
        // 获取特定学员的打卡记录
        if (!student_id) {
          return NextResponse.json(
            { error: '缺少学员ID参数' },
            { status: 400 }
          )
        }

        const { data: studentCheckins, error: studentError } = await supabase
          .from('checkin_records')
          .select('*')
          .eq('student_id', student_id)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (studentError) throw studentError

        return NextResponse.json({
          success: true,
          data: studentCheckins,
          message: `获取学员${student_id}的${studentCheckins.length}个打卡记录成功`
        })

      case 'student_stats':
        // 获取特定学员的统计数据
        if (!student_id) {
          return NextResponse.json(
            { error: '缺少学员ID参数' },
            { status: 400 }
          )
        }

        const { data: allCheckins, error: allError } = await supabase
          .from('checkin_records')
          .select('*')
          .eq('student_id', student_id)

        if (allError) throw allError

        const totalCheckins = allCheckins.length
        const passedCheckins = allCheckins.filter(record => record.passed).length
        const passRate = totalCheckins > 0 ? (passedCheckins / totalCheckins * 100).toFixed(1) : '0'

        return NextResponse.json({
          success: true,
          data: {
            student_id,
            total_checkins: totalCheckins,
            passed_checkins: passedCheckins,
            pass_rate: passRate,
            latest_checkin: allCheckins[0]?.created_at || null
          },
          message: `获取学员${student_id}的统计数据成功`
        })

      default:
        return NextResponse.json(
          { error: '不支持的查询类型，支持的类型：checkin_stats, recent_checkins, student_checkins, student_stats' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('学员统计API错误:', error)
    return NextResponse.json(
      { error: '查询失败', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, student_id, content, notes } = body

    if (action === 'add_checkin_note') {
      // 为打卡记录添加备注
      if (!student_id) {
        return NextResponse.json(
          { error: '缺少学员ID参数' },
          { status: 400 }
        )
      }

      // 获取最新的打卡记录
      const { data: latestCheckin, error: fetchError } = await supabase
        .from('checkin_records')
        .select('*')
        .eq('student_id', student_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError) throw fetchError

      // 更新打卡记录的备注
      const { data: updatedCheckin, error: updateError } = await supabase
        .from('checkin_records')
        .update({
          content: content || latestCheckin.content,
          notes: notes || latestCheckin.notes
        })
        .eq('id', latestCheckin.id)
        .select()
        .single()

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        data: updatedCheckin,
        message: '打卡记录更新成功'
      })
    }

    return NextResponse.json(
      { error: '不支持的操作类型，支持的类型：add_checkin_note' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('学员统计POST API错误:', error)
    return NextResponse.json(
      { error: '操作失败', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
