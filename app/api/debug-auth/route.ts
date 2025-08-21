import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, password } = body

    // 直接查询数据库
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', student_id)
      .single()

    return NextResponse.json({
      success: true,
      debug: {
        inputStudentId: student_id,
        inputPassword: password,
        queryError: error,
        userData: user,
        passwordMatch: user?.password === password,
        passwordInDb: user?.password,
        passwordType: typeof user?.password,
        passwordLength: user?.password?.length,
        inputPasswordType: typeof password,
        inputPasswordLength: password?.length,
        exactMatch: user?.password === password,
        trimmedMatch: user?.password?.trim() === password?.trim()
      }
    })

  } catch (error: unknown) {
    console.error('Debug auth error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}