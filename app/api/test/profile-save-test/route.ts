import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [测试API] 开始测试个人信息保存功能')

    const body = await request.json()
    const { student_id, name, real_name, persona, keywords, vision } = body

    if (!student_id) {
      return NextResponse.json({
        success: false,
        error: '学号不能为空'
      }, { status: 400 })
    }

    console.log('🔄 [测试API] 尝试更新学员数据:', { student_id, name, real_name })

    // 准备更新数据
    const updateData: any = {
      student_id,
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (real_name !== undefined) updateData.real_name = real_name
    if (persona !== undefined) updateData.persona = persona
    if (keywords !== undefined) updateData.keywords = keywords
    if (vision !== undefined) updateData.vision = vision

    // 执行数据库操作
    const { data, error } = await supabase
      .from('users')
      .upsert(updateData, {
        onConflict: 'student_id',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error('❌ [测试API] 数据库操作失败:', error)
      return NextResponse.json({
        success: false,
        error: `数据库操作失败: ${error.message}`,
        details: error
      }, { status: 500 })
    }

    console.log('✅ [测试API] 个人信息保存成功:', data)

    return NextResponse.json({
      success: true,
      message: '个人信息保存测试成功',
      data: data,
      environment: process.env.VERCEL ? 'Vercel' : (process.env.NETLIFY ? 'Netlify' : 'Local'),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [测试API] 测试过程中出现异常:', error)
    return NextResponse.json({
      success: false,
      error: `测试过程中出现异常: ${error instanceof Error ? error.message : String(error)}`,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: '个人信息保存功能测试API',
    usage: 'POST /api/test/profile-save-test',
    parameters: {
      student_id: '必需 - 学员学号',
      name: '可选 - 学员姓名',
      real_name: '可选 - 真实姓名',
      persona: '可选 - 人设定位',
      keywords: '可选 - 关键词',
      vision: '可选 - 愿景'
    },
    environment: process.env.VERCEL ? 'Vercel' : (process.env.NETLIFY ? 'Netlify' : 'Local')
  })
}