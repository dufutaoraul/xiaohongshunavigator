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

    // 先查询提交记录
    const { data: submissionsData, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (submissionsError) {
      console.error('获取提交记录失败:', submissionsError);
      return NextResponse.json({ error: '获取提交记录失败' }, { status: 500 });
    }

    // 如果没有提交记录，直接返回
    if (!submissionsData || submissionsData.length === 0) {
      console.log('没有找到提交记录');
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // 获取所有作业信息
    const { data: assignmentsData, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select('*');

    if (assignmentsError) {
      console.error('获取作业信息失败:', assignmentsError);
      return NextResponse.json({ error: '获取作业信息失败' }, { status: 500 });
    }

    // 合并数据
    const mergedData = submissionsData.map(submission => {
      const assignment = assignmentsData?.find(a => a.assignment_id === submission.assignment_id);
      return {
        ...submission,
        assignments: assignment || {}
      };
    });

    console.log(`找到 ${mergedData?.length || 0} 条提交记录`);

    return NextResponse.json({
      success: true,
      data: mergedData || []
    });

  } catch (error) {
    console.error('我的作业API错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}