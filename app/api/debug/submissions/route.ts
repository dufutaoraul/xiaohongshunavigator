import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 });
    }

    // 查询所有提交记录
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .limit(20);

    // 查询所有作业记录
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .limit(20);

    // 查询数据库表结构
    const { data: submissionsSchema } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'submissions')
      .eq('table_schema', 'public');

    const { data: assignmentsSchema } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'assignments')
      .eq('table_schema', 'public');

    return NextResponse.json({
      success: true,
      data: {
        submissions: submissions || [],
        assignments: assignments || [],
        schemas: {
          submissions: submissionsSchema || [],
          assignments: assignmentsSchema || []
        },
        errors: {
          submissions: submissionsError,
          assignments: assignmentsError
        },
        availableStudentIds: Array.from(new Set((submissions || []).map(s => s.student_id))),
        totalSubmissions: submissions?.length || 0,
        totalAssignments: assignments?.length || 0
      }
    });

  } catch (error) {
    console.error('调试API错误:', error);
    return NextResponse.json({ 
      error: '调试API失败', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}