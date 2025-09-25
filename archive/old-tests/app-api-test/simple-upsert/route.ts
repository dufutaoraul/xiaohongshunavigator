import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 开始简单upsert测试...')

    const body = await request.json()
    const { student_id } = body

    // 第一步：测试基本查询
    console.log('📖 步骤1: 测试基本查询')
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', student_id)
      .single()

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('❌ 查询错误:', queryError)
      return NextResponse.json({
        step: 'query',
        success: false,
        error: queryError
      }, { status: 500 })
    }

    console.log('✅ 查询成功, 现有用户:', existingUser)

    // 第二步：测试简单update
    if (existingUser) {
      console.log('📝 步骤2: 测试更新现有用户')
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          real_name: body.real_name || '测试更新',
          persona: body.persona || '测试人设',
          keywords: body.keywords || '测试关键词',
          vision: body.vision || '测试愿景'
        })
        .eq('student_id', student_id)
        .select()

      if (updateError) {
        console.error('❌ 更新错误:', updateError)
        return NextResponse.json({
          step: 'update',
          success: false,
          error: updateError
        }, { status: 500 })
      }

      console.log('✅ 更新成功:', updateData)
      return NextResponse.json({
        step: 'update',
        success: true,
        data: updateData,
        message: '更新成功'
      })
    } else {
      // 第三步：测试创建新用户
      console.log('📝 步骤3: 用户不存在，测试创建')
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          student_id: student_id,
          name: body.name || '测试用户',
          real_name: body.real_name || '测试真实姓名',
          persona: body.persona || '测试人设',
          keywords: body.keywords || '测试关键词',
          vision: body.vision || '测试愿景',
          role: 'student'
        })
        .select()

      if (insertError) {
        console.error('❌ 插入错误:', insertError)
        return NextResponse.json({
          step: 'insert',
          success: false,
          error: insertError
        }, { status: 500 })
      }

      console.log('✅ 插入成功:', insertData)
      return NextResponse.json({
        step: 'insert',
        success: true,
        data: insertData,
        message: '创建成功'
      })
    }

  } catch (error) {
    console.error('🚨 简单upsert测试错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}