const { createClient } = require('@supabase/supabase-js');

// 生产数据库配置
const prodSupabase = createClient(
  'https://jwfthdjxmqexsvzyiral.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZnRoZGp4bXFleHN2enlpcmFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYzNTU0NywiZXhwIjoyMDcwMjExNTQ3fQ.4Lf-HEfw-8qZPBt2Dc0jS83Q7LOnLm603pwbHsKyK5A'
);

async function checkProdDatabase() {
  console.log('🔍 检查生产数据库表结构...\n');
  
  try {
    // 检查已知的关键表
    const keyTables = [
      'users', 
      'checkin_records', 
      'checkin_schedules',
      'student_checkins',  // 可能的旧表名
      'assignments',
      'submissions',
      'xhs_checkins',
      'xhs_notes_cache'
    ];
    
    console.log('📋 检查关键表:');
    
    for (const tableName of keyTables) {
      console.log(`\n🔍 检查表: ${tableName}`);
      
      // 尝试查询表结构
      const { data, error } = await prodSupabase
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
          console.log(`    ${field}: ${type} (示例: ${JSON.stringify(value).substring(0, 50)}...)`);
        });
      } else {
        console.log(`📊 表为空`);
      }
      
      // 获取记录数量
      const { count, error: countError } = await prodSupabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`📊 记录数量: ${count}`);
      }
    }

  } catch (error) {
    console.error('❌ 检查数据库时出错:', error);
  }
}

checkProdDatabase().catch(console.error);
