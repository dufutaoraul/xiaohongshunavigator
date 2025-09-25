import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 开始调试个人信息保存...')

    const body = await request.json()
    console.log('📥 接收到的数据:', body)

    const { student_id, name, real_name, persona, keywords, vision } = body

    // 测试直接upsert到users表
    console.log('📝 尝试保存到users表...')

    const updateData = {
      student_id,
      name,
      real_name,
      persona,
      keywords,
      vision
    }

    console.log('💾 准备保存的数据:', updateData)

    const { data, error } = await supabase
      .from('users')
      .upsert(updateData, {
        onConflict: 'student_id'
      })
      .select()

    if (error) {
      console.error('❌ Supabase错误:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }

    console.log('✅ 保存成功:', data)

    return NextResponse.json({
      success: true,
      message: '保存成功',
      data: data
    })

  } catch (error) {
    console.error('🚨 调试过程出错:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}