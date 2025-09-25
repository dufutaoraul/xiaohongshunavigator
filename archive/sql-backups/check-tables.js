const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 检查数据库中的表...');
  
  // 检查可能的表名
  const tableNames = ['student_checkins', 'checkin_records', 'checkins'];
  
  for (const tableName of tableNames) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    console.log(`表 ${tableName}: ${error ? '❌ 不存在' : '✅ 存在'}`);
    if (error) {
      console.log(`  错误: ${error.message}`);
    } else {
      console.log(`  数据条数: ${data?.length || 0}`);
    }
  }
}

checkTables().catch(console.error);
