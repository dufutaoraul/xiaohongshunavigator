import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBeijingDateString } from '@/lib/date-utils'
import { validateXHSPost, hasXHSProfileBound } from '@/lib/xhs-validator'

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

    // 获取学员信息（包括小红书主页绑定）
    console.log('🔍 [Checkin Submit API] 获取学员信息:', student_id)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, student_id, name, role, xiaohongshu_profile_url')
      .eq('student_id', student_id)
      .single()

    if (userError) {
      console.error('❌ [Checkin Submit API] 学员不存在或查询失败:', {
        student_id,
        error: userError,
        code: userError.code,
        message: userError.message
      })
      return NextResponse.json({
        success: false,
        error: `学员 ${student_id} 不存在或查询失败: ` + userError.message
      }, { status: 404 })
    }

    if (!userData) {
      console.error('❌ [Checkin Submit API] 学员数据为空:', student_id)
      return NextResponse.json({
        success: false,
        error: `学员 ${student_id} 不存在`
      }, { status: 404 })
    }

    console.log('✅ [Checkin Submit API] 学员信息获取成功:', {
      student_id: userData.student_id,
      name: userData.name,
      hasXHSProfile: !!userData.xiaohongshu_profile_url
    })

    // 获取该学员已有的打卡记录（用于重复检测）
    console.log('🔍 [Checkin Submit API] 获取已有打卡记录进行重复检测...')
    const { data: existingRecords, error: existingError } = await supabase
      .from('checkin_records')
      .select('xhs_url')
      .eq('student_id', student_id)

    if (existingError) {
      console.error('❌ [Checkin Submit API] 获取已有记录失败:', existingError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch existing records: ' + existingError.message
      }, { status: 500 })
    }

    // 提取已存在的URL列表
    const existingUrls = (existingRecords || []).map(record =>
      record.xhs_url
    ).filter(Boolean)

    console.log('🔍 [Checkin Submit API] 已有打卡记录数量:', existingUrls.length)

    // 验证 URLs 格式和重复性
    console.log('🔍 [Checkin Submit API] 开始验证URLs:', urls)
    const validationResults = urls.map((url, index) => {
      const validation = validateXHSPost(
        url,
        userData.xiaohongshu_profile_url,
        existingUrls
      )
      console.log(`🔍 [Checkin Submit API] URL[${index}] 验证结果:`, {
        url: url.substring(0, 50) + '...',
        isValid: validation.isValid,
        reason: validation.reason
      })
      return { url, validation }
    })

    const validUrls = validationResults
      .filter(result => result.validation.isValid)
      .map(result => result.url)

    const invalidUrls = validationResults
      .filter(result => !result.validation.isValid)

    console.log('✅ [Checkin Submit API] 验证结果:', {
      valid: validUrls.length,
      invalid: invalidUrls.length,
      hasXHSProfile: hasXHSProfileBound(userData.xiaohongshu_profile_url)
    })

    if (validUrls.length === 0) {
      const firstError = invalidUrls[0]?.validation.reason || '没有有效的小红书链接'
      console.error('❌ [Checkin Submit API] 没有有效链接:', firstError)
      return NextResponse.json(
        {
          success: false,
          error: firstError,
          details: invalidUrls.map(item => ({
            url: item.url.substring(0, 50) + '...',
            reason: item.validation.reason
          }))
        },
        { status: 400 }
      )
    }

    // 如果有无效URL，给出警告但继续处理有效的URL
    if (invalidUrls.length > 0) {
      console.log('⚠️ [Checkin Submit API] 部分URL无效，仅处理有效URL:', {
        validCount: validUrls.length,
        invalidReasons: invalidUrls.map(item => item.validation.reason)
      })
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

    // 首先检查表是否存在并验证连接
    console.log('🔍 [Checkin Submit API] 检查数据库连接和表结构...')

    // 检查 checkin_records 表结构
    const { data: tableInfo, error: tableError } = await supabase
      .from('checkin_records')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('❌ [Checkin Submit API] 数据库连接或表结构错误:', {
        error: tableError,
        code: tableError.code,
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint
      })
      return NextResponse.json({
        success: false,
        error: '数据库连接失败: ' + tableError.message
      }, { status: 500 })
    }
    console.log('✅ [Checkin Submit API] 数据库连接正常，表结构:', tableInfo)

    // 检查今天是否已经打卡
    console.log('🔍 [Checkin Submit API] 检查是否已有打卡记录:', { student_id, checkinDate })
    const { data: existingCheckin, error: checkError } = await supabase
      .from('checkin_records')
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
        xhs_url: xiaohongshu_url // 统一使用 xhs_url 字段
        // 移除 updated_at，让数据库使用默认值
      }
      console.log('🔄 [Checkin Submit API] 更新数据:', updateData)

      const { data, error } = await supabase
        .from('checkin_records')
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

      // 学员信息已在前面获取，直接使用
      console.log('✅ [Checkin Submit API] 使用已获取的学员信息:', {
        student_id: userData.student_id,
        name: userData.name
      })

      const insertData = {
        student_id,
        checkin_date: checkinDate,
        xhs_url: xiaohongshu_url, // 统一使用 xhs_url 字段
        status: 'valid' // 默认状态改为 valid
        // 移除 created_at 和 updated_at，让数据库使用默认值
      }

      console.log('✨ [Checkin Submit API] 准备插入数据:', JSON.stringify(insertData, null, 2))

      const { data, error } = await supabase
        .from('checkin_records')
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
      .from('checkin_records')
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