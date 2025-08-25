import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // 查询所有提交记录
    const { data: submissionsData, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .limit(10);

    if (submissionsError) {
      console.error('查询失败:', submissionsError);
      return NextResponse.json({ error: submissionsError.message }, { status: 500 });
    }

    // 查询所有作业
    const { data: assignmentsData, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .limit(10);

    if (assignmentsError) {
      console.error('查询作业失败:', assignmentsError);
      return NextResponse.json({ error: assignmentsError.message }, { status: 500 });
    }

    return NextResponse.json({
      submissions: submissionsData || [],
      assignments: assignmentsData || [],
      submissions_count: submissionsData?.length || 0,
      assignments_count: assignmentsData?.length || 0
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Server internal error' }, { status: 500 });
  }
}