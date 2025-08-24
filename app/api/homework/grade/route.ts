import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callAIWithFallback } from '@/lib/ai-fallback';

export async function POST(request: NextRequest) {
  let requestData: any = null;
  
  try {
    console.log('AI批改API被调用');
    
    // 先解析请求数据，避免在catch中重复解析
    requestData = await request.json();
    const { studentId, assignmentId, attachmentUrls } = requestData;
    console.log('请求参数:', { studentId, assignmentId, attachmentCount: attachmentUrls?.length });

    if (!studentId || !assignmentId || !attachmentUrls || attachmentUrls.length === 0) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 1. 获取作业要求描述
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select('description, assignment_title')
      .eq('assignment_id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      console.error('获取作业信息失败:', assignmentError);
      return NextResponse.json({ error: '获取作业信息失败' }, { status: 500 });
    }

    console.log('作业信息:', { title: assignmentData.assignment_title, description: assignmentData.description });

    // 2. 调用AI进行批改（带后备方案）
    const gradingResult = await callAIWithFallback(assignmentData.description, attachmentUrls, assignmentData.assignment_title);
    
    console.log('AI批改结果:', gradingResult);

    // 3. 更新数据库批改结果 - 获取最新的提交记录进行更新
    const { data: latestSubmission, error: queryError } = await supabase
      .from('submissions')
      .select('submission_id')
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (queryError || !latestSubmission) {
      console.error('无法找到最新提交记录:', queryError);
      return NextResponse.json({ error: '无法找到提交记录' }, { status: 500 });
    }

    // 使用submission_id进行精确更新
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: gradingResult.status,
        feedback: gradingResult.feedback
      })
      .eq('submission_id', latestSubmission.submission_id);

    if (updateError) {
      console.error('数据库更新失败:', updateError);
      return NextResponse.json({ error: '更新批改结果失败' }, { status: 500 });
    }

    console.log('数据库更新成功');

    return NextResponse.json({ 
      success: true, 
      result: gradingResult 
    });

  } catch (error) {
    console.error('AI批改API错误:', error);
    
    // 如果出错，将状态更新为批改失败（使用已解析的数据）
    if (requestData?.studentId && requestData?.assignmentId) {
      try {
        await supabase
          .from('submissions')
          .update({
            status: '批改失败',
            feedback: '系统错误，请稍后重试'
          })
          .eq('student_id', requestData.studentId)
          .eq('assignment_id', requestData.assignmentId)
          .order('created_at', { ascending: false })
          .limit(1);
      } catch (updateError) {
        console.error('更新失败状态时出错:', updateError);
      }
    }

    return NextResponse.json({ error: '批改失败，请重试' }, { status: 500 });
  }
}