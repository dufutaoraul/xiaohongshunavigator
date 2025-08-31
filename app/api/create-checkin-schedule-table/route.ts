import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用service role key来执行DDL操作
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('Creating checkin_schedules table...')
    
    // 由于无法直接执行DDL，返回需要手动执行的SQL
    const createTableSQL = `
-- 创建打卡时间安排表
CREATE TABLE IF NOT EXISTS checkin_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(student_id, start_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_checkin_schedules_student_id ON checkin_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_checkin_schedules_dates ON checkin_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_checkin_schedules_active ON checkin_schedules(is_active);

-- 添加注释
COMMENT ON TABLE checkin_schedules IS '学员打卡时间安排表';
COMMENT ON COLUMN checkin_schedules.student_id IS '学员学号';
COMMENT ON COLUMN checkin_schedules.start_date IS '打卡开始日期';
COMMENT ON COLUMN checkin_schedules.end_date IS '打卡结束日期（开始日期+93天）';
COMMENT ON COLUMN checkin_schedules.created_by IS '创建者（管理员学号）';
COMMENT ON COLUMN checkin_schedules.is_active IS '是否激活';
    `
    
    return NextResponse.json({
      success: false,
      message: 'Please execute the following SQL in Supabase SQL Editor to create the checkin_schedules table:',
      sql: createTableSQL
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
