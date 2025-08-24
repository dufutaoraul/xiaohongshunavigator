import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服务角色密钥绕过RLS
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    console.log('📋 我的作业API被调用');
    
    const { studentId } = await request.json();
    
    if (!studentId) {
      return NextResponse.json({ error: '缺少学生ID' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 });
    }

    console.log(`查询学生提交记录: ${studentId}`);

    // 查询提交记录，包含关联的作业信息
    const { data: submissionsData, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        assignments!inner(
          assignment_id,
          assignment_title,
          day_text,
          description,
          is_mandatory
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (submissionsError) {
      console.error('获取提交记录失败:', submissionsError);
      return NextResponse.json({ error: '获取提交记录失败' }, { status: 500 });
    }

    console.log(`找到 ${submissionsData?.length || 0} 条提交记录`);

    return NextResponse.json({
      success: true,
      data: submissionsData || []
    });

  } catch (error) {
    console.error('我的作业API错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}