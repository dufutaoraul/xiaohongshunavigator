import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBeijingDateString } from '@/lib/date-utils'

interface CheckinRequest {
  student_id: string
  urls: string[]
  date?: string // 可选，默认为今天
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckinRequest = await request.json()
    console.log('🚀 [Checkin Submit API] 收到打卡请求:', JSON.stringify(body, null, 2))
    
    const { student_id, urls, date } = body

    if (!student_id) {
      console.error('❌ [Checkin Submit API] 缺少student_id参数')
      return NextResponse.json(
        { success: false, error: 'Missing student_id parameter' },
        { status: 400 }
      )
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      console.error('❌ [Checkin Submit API] 缺少urls参数或urls为空:', { urls, isArray: Array.isArray(urls), length: urls?.length })
      return NextResponse.json(
        { success: false, error: 'Missing or empty urls array' },
        { status: 400 }
      )
    }

    // 验证 URLs 格式
    console.log('🔍 [Checkin Submit API] 开始验证URLs:', urls)
    const validUrls = urls.filter((url, index) => {
      try {
        new URL(url)
        const isValid = url.includes('xiaohongshu.com') || url.includes('xhslink.com')
        console.log(`🔍 [Checkin Submit API] URL[${index}] 验证结果:`, { url, isValid })
        return isValid
      } catch (error) {
        console.log(`❌ [Checkin Submit API] URL[${index}] 格式错误:`, { url, error: error instanceof Error ? error.message : String(error) })
        return false
      }
    })

    console.log('✅ [Checkin Submit API] 有效URLs:', validUrls)

    if (validUrls.length === 0) {
      console.error('❌ [Checkin Submit API] 没有有效的小红书链接')
      return NextResponse.json(
        { success: false, error: 'No valid xiaohongshu URLs provided' },
        { status: 400 }
      )
    }

    // 使用提供的日期或今天（北京时间）
    const checkinDate = date || getBeijingDateString()
    
    console.log('🕐 打卡日期确定:', {
      传入日期: date,
      最终日期: checkinDate,
      是否使用当前北京时间: !date
    })
    
    console.log(`📝 [Checkin] 学员 ${student_id} 提交打卡，日期: ${checkinDate}, URLs: ${validUrls.length}个`)

    // 使用第一个有效URL作为小红书链接
    const xiaohongshu_url = validUrls[0]

    // 首先检查表是否存在
    console.log('🔍 [Checkin Submit API] 检查数据库表是否存在...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('student_checkins')
      .select('count(*)')
      .limit(1)

    if (tableError) {
      console.error('❌ [Checkin Submit API] 检查表存在性失败:', tableError)
      return NextResponse.json({
        success: false,
        error: '数据库表不存在或无法访问: ' + tableError.message
      }, { status: 500 })
    }
    console.log('✅ [Checkin Submit API] 数据库表检查通过')

    // 检查今天是否已经打卡
    console.log('🔍 [Checkin Submit API] 检查是否已有打卡记录:', { student_id, checkinDate })
    const { data: existingCheckin, error: checkError } = await supabase
      .from('student_checkins')
      .select('*')
      .eq('student_id', student_id)
      .eq('checkin_date', checkinDate)
      .maybeSingle()

    if (checkError) {
      console.error('❌ [Checkin Submit API] 检查现有记录失败:', checkError)
      return NextResponse.json(
        { success: false, error: 'Database query failed: ' + checkError.message },
        { status: 500 }
      )
    }

    console.log('🔍 [Checkin Submit API] 现有打卡记录查询结果:', existingCheckin)

    let result
    if (existingCheckin) {
      // 更新现有打卡记录
      console.log(`🔄 [Checkin Submit API] 更新现有打卡记录 ID: ${existingCheckin.id}`)
      const updateData = {
        xiaohongshu_link: xiaohongshu_url, // 使用正确的字段名
        updated_at: new Date().toISOString()
      }
      console.log('🔄 [Checkin Submit API] 更新数据:', updateData)

      const { data, error } = await supabase
        .from('student_checkins')
        .update(updateData)
        .eq('id', existingCheckin.id)
        .select()

      if (error) {
        console.error('❌ [Checkin Submit API] 更新打卡记录失败:', error)
        console.error('❌ [Checkin Submit API] 错误详情:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return NextResponse.json(
          { success: false, error: 'Failed to update checkin record: ' + error.message },
          { status: 500 }
        )
      }
      console.log('✅ [Checkin Submit API] 更新成功，返回数据:', data)
      result = data?.[0]
    } else {
      // 创建新的打卡记录
      console.log(`✨ [Checkin Submit API] 创建新打卡记录`)

      // 获取学员姓名
      console.log('🔍 [Checkin Submit API] 获取学员信息:', student_id)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('student_id', student_id)
        .single()

      if (userError) {
        console.error('❌ [Checkin Submit API] 获取学员信息失败:', userError)
      }
      console.log('🔍 [Checkin Submit API] 学员信息查询结果:', userData)

      const student_name = userData?.name || '未知学员'

      const insertData = {
        student_id,
        checkin_date: checkinDate,
        xiaohongshu_link: xiaohongshu_url, // 使用正确的字段名
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('✨ [Checkin Submit API] 准备插入数据:', JSON.stringify(insertData, null, 2))

      const { data, error } = await supabase
        .from('student_checkins')
        .insert(insertData)
        .select()

      if (error) {
        console.error('❌ [Checkin Submit API] 创建打卡记录失败:', error)
        console.error('❌ [Checkin Submit API] 错误详情:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return NextResponse.json(
          { success: false, error: 'Failed to create checkin record: ' + error.message + (error.details ? ' - ' + error.details : '') },
          { status: 500 }
        )
      }
      console.log('✅ [Checkin Submit API] 创建成功，返回数据:', data)
      result = data?.[0]
    }

    console.log('🎉 [Checkin Submit API] 打卡记录保存成功:', result)

    const response = {
      success: true,
      data: result,
      message: existingCheckin ? '打卡记录已更新' : '打卡提交成功'
    }
    console.log('🎉 [Checkin Submit API] 最终响应:', JSON.stringify(response, null, 2))

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('💥 [Checkin Submit API] 打卡提交过程中出错:', error)
    console.error('💥 [Checkin Submit API] 错误堆栈:', error.stack)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    const errorResponse = { success: false, error: 'Server internal error: ' + errorMessage }
    console.error('💥 [Checkin Submit API] 错误响应:', errorResponse)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// GET 方法：获取打卡历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const student_id = searchParams.get('student_id')
    const days = parseInt(searchParams.get('days') || '30')

    if (!student_id) {
      return NextResponse.json(
        { success: false, error: 'Missing student_id parameter' },
        { status: 400 }
      )
    }

    console.log(`📊 [Checkin] 获取学员 ${student_id} 最近 ${days} 天的打卡记录`)

    // 获取最近N天的打卡记录（基于北京时间）
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = getBeijingDateString(startDate)

    const { data: checkins, error } = await supabase
      .from('student_checkins')
      .select('*')
      .eq('student_id', student_id)
      .gte('checkin_date', startDateStr)
      .order('checkin_date', { ascending: false })

    if (error) {
      console.error('获取打卡历史失败:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch checkin history: ' + error.message },
        { status: 500 }
      )
    }

    // 统计信息
    const totalDays = checkins?.length || 0
    const passedDays = checkins?.filter(c => c.status === 'approved').length || 0
    const pendingDays = checkins?.filter(c => c.status === 'pending').length || 0

    console.log(`📈 [Checkin] 统计结果: 总计${totalDays}天, 通过${passedDays}天, 待审核${pendingDays}天`)

    return NextResponse.json({
      success: true,
      data: {
        student_id,
        period_days: days,
        total_checkin_days: totalDays,
        passed_days: passedDays,
        pending_days: pendingDays,
        pass_rate: totalDays > 0 ? (passedDays / totalDays * 100).toFixed(1) : '0.0',
        checkins: checkins || []
      }
    })

  } catch (error: any) {
    console.error('获取打卡历史出错:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      { success: false, error: 'Failed to fetch checkin history: ' + errorMessage },
      { status: 500 }
    )
  }
}