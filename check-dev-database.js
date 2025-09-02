const { createClient } = require('@supabase/supabase-js');

// 开发数据库配置
const devSupabase = createClient(
  'https://edoljoofbxinghqidgmr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkb2xqb29mYnhpbmdocWlkZ21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMzcxNCwiZXhwIjoyMDcwNDg5NzE0fQ.aN3NjbYp-57tUsK7OXvNFpPevTPZ1eO9ci9oTcVjEQ4'
);

async function checkDevDatabase() {
  console.log('🔍 检查开发数据库表结构...\n');

  try {
    // 检查已知的关键表
    const keyTables = [
      'users',
      'checkin_records',
      'checkin_schedules',
      'assignments',
      'submissions',
      'xhs_checkins',
      'xhs_notes_cache'
    ];

    console.log('📋 检查关键表:');

    for (const tableName of keyTables) {
      console.log(`\n🔍 检查表: ${tableName}`);

      // 尝试查询表结构
      const { data, error } = await devSupabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ 表 ${tableName} 不存在或无法访问: ${error.message}`);
        continue;
      }

      console.log(`✅ 表 ${tableName} 存在`);

      if (data && data.length > 0) {
        console.log(`📊 字段结构:`);
        const fields = Object.keys(data[0]);
        fields.forEach(field => {
          const value = data[0][field];
          const type = typeof value;
          console.log(`    ${field}: ${type} (示例: ${value})`);
        });
      } else {
        console.log(`📊 表为空，尝试插入测试数据查看结构...`);
      }
    }

    // 特别检查 checkin_records 表
    console.log(`\n🎯 详细检查 checkin_records 表:`);
    const { data: checkinData, error: checkinError } = await devSupabase
      .from('checkin_records')
      .select('*')
      .limit(5);

    if (!checkinError && checkinData) {
      console.log(`✅ checkin_records 表有 ${checkinData.length} 条记录`);
      if (checkinData.length > 0) {
        console.log('示例记录:', JSON.stringify(checkinData[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ 检查数据库时出错:', error);
  }
}

checkDevDatabase().catch(console.error);
