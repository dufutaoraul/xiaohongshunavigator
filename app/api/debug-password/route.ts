import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 查询用户密码的详细信息
    const { data: user, error } = await supabase
      .from('users')
      .select('student_id, name, password')
      .eq('student_id', student_id)
      .single()

    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: error?.message
      })
    }

    const password = user.password
    
    // 详细分析密码
    const passwordAnalysis = {
      raw: password,
      type: typeof password,
      length: password ? password.length : 0,
      charCodes: password ? Array.from(password).map((char: string) => ({
        char: char,
        code: char.charCodeAt(0),
        isVisible: char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126
      })) : [],
      trimmed: password ? password.trim() : '',
      trimmedLength: password ? password.trim().length : 0,
      hasWhitespace: password ? /\s/.test(password) : false,
      startsWithSpace: password ? password.startsWith(' ') : false,
      endsWithSpace: password ? password.endsWith(' ') : false,
      bytes: password ? new TextEncoder().encode(password).length : 0
    }

    // 测试不同的密码比较方式
    const testPassword = '12345678'
    const comparisons = {
      direct: password === testPassword,
      trimmed: password?.trim() === testPassword.trim(),
      lowercase: password?.toLowerCase() === testPassword.toLowerCase(),
      substring: password?.substring(0, 8) === testPassword,
      includes: password?.includes(testPassword),
      startsWith: password?.startsWith(testPassword)
    }

    return NextResponse.json({
      success: true,
      user: {
        student_id: user.student_id,
        name: user.name
      },
      passwordAnalysis,
      comparisons,
      testPassword,
      recommendation: password?.length !== 8 ? 'Password length mismatch - may need to update password in database' : 'Password length correct'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}