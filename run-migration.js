const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从环境变量文件读取配置
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🚀 开始检查和创建数据库结构...');

  try {
    // 首先检查现有结构
    console.log('🔍 检查现有数据库结构...');

    // 检查users表字段
    const { data: userColumns, error: userError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('table_schema', 'public');

    if (userError) {
      console.error('❌ 检查users表失败:', userError);
      return;
    }

    const columnNames = userColumns.map(col => col.column_name);
    console.log('📋 users表现有字段:', columnNames);

    const requiredFields = ['can_self_schedule', 'self_schedule_deadline', 'has_used_self_schedule'];
    const missingFields = requiredFields.filter(field => !columnNames.includes(field));

    if (missingFields.length > 0) {
      console.log('⚠️  缺少字段:', missingFields);
      console.log('💡 请手动在Supabase控制台执行以下SQL:');
      console.log('');
      console.log('-- 为users表添加自主设定权限字段');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS can_self_schedule boolean DEFAULT false;');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS self_schedule_deadline timestamp;');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS has_used_self_schedule boolean DEFAULT false;');
      console.log('');
      console.log('-- 创建批量权限范围表');
      console.log(`CREATE TABLE IF NOT EXISTS self_schedule_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_student_id text NOT NULL,
  end_student_id text NOT NULL,
  created_by text NOT NULL,
  created_at timestamp DEFAULT now(),
  is_active boolean DEFAULT true
);`);
      console.log('');
      console.log('-- 为checkin_schedules表添加设置类型字段');
      console.log("ALTER TABLE checkin_schedules ADD COLUMN IF NOT EXISTS schedule_type text DEFAULT 'admin_set';");
      console.log('');
      console.log('-- 更新现有用户的自主设定截止时间');
      console.log(`UPDATE users
SET self_schedule_deadline = created_at + INTERVAL '6 months'
WHERE self_schedule_deadline IS NULL;`);
    } else {
      console.log('✅ users表所有必需字段都存在');
    }

    // 检查self_schedule_ranges表
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'self_schedule_ranges');

    if (tableError) {
      console.error('❌ 检查表失败:', tableError);
    } else if (tables.length > 0) {
      console.log('✅ self_schedule_ranges表存在');
    } else {
      console.log('❌ self_schedule_ranges表不存在，需要创建');
    }

    // 检查checkin_schedules表的schedule_type字段
    const { data: scheduleColumns, error: scheduleError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'checkin_schedules')
      .eq('table_schema', 'public');

    if (scheduleError) {
      console.error('❌ 检查checkin_schedules表失败:', scheduleError);
    } else {
      const scheduleColumnNames = scheduleColumns.map(col => col.column_name);
      if (scheduleColumnNames.includes('schedule_type')) {
        console.log('✅ checkin_schedules表的schedule_type字段存在');
      } else {
        console.log('❌ checkin_schedules表缺少schedule_type字段');
      }
    }
    
  } catch (error) {
    console.error('💥 迁移过程中发生错误:', error);
  }
}

runMigration();
