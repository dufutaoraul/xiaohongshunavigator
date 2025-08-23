import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('AI批改API被调用');
    
    const requestData = await request.json();
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

    // 2. 模拟AI批改过程 (未来可以接入真实AI服务)
    await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟处理时间
    
    // 简单的模拟批改逻辑
    const isPass = Math.random() > 0.3; // 70%通过率
    const gradingResult = {
      status: isPass ? '合格' : '不合格',
      feedback: isPass 
        ? '作业完成良好，符合要求。展示了对知识点的理解和实际应用能力。'
        : '作业存在一些问题，建议补充更多细节和说明。请重新提交改进版本。'
    };
    
    console.log('AI批改结果:', gradingResult);

    // 3. 更新数据库批改结果
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: gradingResult.status,
        feedback: gradingResult.feedback
      })
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false })
      .limit(1);

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
    
    // 如果出错，将状态更新为批改失败
    const requestData = await request.json().catch(() => ({}));
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