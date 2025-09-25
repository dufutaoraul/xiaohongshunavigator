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

async function testAPI() {
  console.log('🧪 测试API连接...');
  
  try {
    // 测试基本连接
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('student_id, name')
      .limit(1);
    
    if (userError) {
      console.error('❌ 连接users表失败:', userError);
      return;
    }
    
    console.log('✅ 成功连接数据库');
    console.log('📋 用户示例:', users[0]);
    
    // 测试是否有新字段
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .select('student_id, can_self_schedule, self_schedule_deadline, has_used_self_schedule')
      .limit(1);
    
    if (testError) {
      console.error('❌ 新字段不存在:', testError);
      console.log('💡 需要手动在Supabase控制台执行数据库迁移SQL');
    } else {
      console.log('✅ 新字段存在，数据库迁移已完成');
      console.log('📋 字段示例:', testUser[0]);
    }
    
    // 测试self_schedule_ranges表
    const { data: ranges, error: rangeError } = await supabase
      .from('self_schedule_ranges')
      .select('*')
      .limit(1);
    
    if (rangeError) {
      console.error('❌ self_schedule_ranges表不存在:', rangeError);
    } else {
      console.log('✅ self_schedule_ranges表存在');
    }
    
    // 测试API路由
    console.log('\n🌐 测试API路由...');
    
    // 测试管理员权限设置API
    const response1 = await fetch('http://localhost:3006/api/admin/self-schedule-permission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'set_individual',
        student_id: 'test123',
        admin_id: 'admin'
      })
    });
    
    console.log('管理员权限设置API状态:', response1.status);
    if (response1.status !== 200) {
      const text = await response1.text();
      console.log('响应内容:', text.substring(0, 200));
    }
    
    // 测试学员自主设定API
    const response2 = await fetch('http://localhost:3006/api/student/self-schedule', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('学员自主设定API状态:', response2.status);
    if (response2.status !== 200) {
      const text = await response2.text();
      console.log('响应内容:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.error('💥 测试过程中发生错误:', error);
  }
}

testAPI();
