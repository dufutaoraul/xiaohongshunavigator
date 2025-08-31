import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Creating admin user...')
    
    // 创建管理员账户
    const adminData = {
      student_id: 'ADMIN001',
      name: '系统管理员',
      real_name: '管理员',
      role: 'admin',
      password: 'admin123',
      persona: '系统管理员',
      keywords: '管理,系统,运营',
      vision: '管理好整个系统'
    }
    
    const { data, error } = await supabase
      .from('users')
      .upsert(adminData, {
        onConflict: 'student_id'
      })
      .select()

    if (error) {
      console.error('Error creating admin:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      })
    }

    console.log('Admin user created successfully')
    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      data: data
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
