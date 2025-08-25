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

    // 使用JOIN查询提交记录和作业信息
    const { data: submissionsData, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        assignment:assignment_id(*)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (submissionsError) {
      console.error('获取提交记录失败:', submissionsError);
      return NextResponse.json({ error: '获取提交记录失败' }, { status: 500 });
    }

    // 如果没有提交记录，查询并提示可用的学号
    if (!submissionsData || submissionsData.length === 0) {
      console.log('没有找到提交记录');
      
      // 查询数据库中存在的学号
      const { data: availableStudents } = await supabaseAdmin
        .from('submissions')
        .select('student_id')
        .limit(10);
      
      const uniqueStudentIds = new Set(availableStudents?.map(s => s.student_id) || []);
      const availableIds = Array.from(uniqueStudentIds);
      
      return NextResponse.json({
        success: true,
        data: [],
        message: availableIds.length > 0 
          ? `学号 ${studentId} 没有找到提交记录。数据库中存在的学号: ${availableIds.join(', ')}`
          : `学号 ${studentId} 没有找到提交记录，数据库中暂无任何提交记录。`
      });
    }

    // 数据已经通过JOIN合并了，直接使用
    const mergedData = submissionsData.map(submission => {
      return {
        ...submission,
        assignment: submission.assignment || {
          assignment_id: submission.assignment_id,
          assignment_title: submission.assignment_title || '未知作业',
          day_text: submission.day_text || '未知天数',
          is_mandatory: submission.is_mandatory || false,
          description: submission.description || ''
        }
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