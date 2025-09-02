import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - 获取待审核的打卡记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('🔍 [Admin Review API] 获取打卡记录:', { status, limit, offset })

    // 获取打卡记录
    const { data: records, error } = await supabase
      .from('checkin_records')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ [Admin Review API] 查询失败:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ [Admin Review API] 返回记录数量:', records?.length || 0)

    return NextResponse.json({
      success: true,
      records: records || [],
      total: records?.length || 0
    })

  } catch (error) {
    console.error('❌ [Admin Review API] 服务器错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// PUT - 审核打卡记录
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { record_id, status, admin_review_notes, reviewed_by } = body

    console.log('🔍 [Admin Review API] 审核打卡记录:', { record_id, status, admin_review_notes })

    if (!record_id || !status || !reviewed_by) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 })
    }

    if (!['valid', 'invalid', 'pending'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: '无效的状态值'
      }, { status: 400 })
    }

    // 更新打卡记录状态
    const { data, error } = await supabase
      .from('checkin_records')
      .update({
        status,
        admin_review_notes,
        reviewed_by,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', record_id)
      .select()

    if (error) {
      console.error('❌ [Admin Review API] 更新失败:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ [Admin Review API] 审核成功:', data)

    return NextResponse.json({
      success: true,
      message: '审核完成',
      data: data?.[0]
    })

  } catch (error) {
    console.error('❌ [Admin Review API] 服务器错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
