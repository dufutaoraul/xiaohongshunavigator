import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase connection...')
    console.log('🔍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('🔍 Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    // 简单的连接测试
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.error('🔍 Supabase connection error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    console.log('🔍 Supabase connection successful')
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      env_check: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    })

  } catch (error: any) {
    console.error('🔍 Connection test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error?.message
    }, { status: 500 })
  }
}
