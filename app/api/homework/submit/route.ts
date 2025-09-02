import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用Service Role Key创建管理员客户端，绕过RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const submissionData = await request.json();
    
    console.log('📝 API接收到作业提交数据:', submissionData);
    
    // 使用管理员权限插入数据，绕过RLS
    const { data, error } = await adminSupabase
      .from('submissions')
      .insert(submissionData)
      .select();
    
    if (error) {
      console.error('💥 数据库插入错误:', error);
      return NextResponse.json(
        { error: `数据库插入失败: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('✅ 作业提交成功:', data);
    
    return NextResponse.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('🔥 API处理错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}