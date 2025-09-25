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

async function testSpecificUser() {
  console.log('🧪 测试特定用户API...');
  
  try {
    // 找一个有自主设定权限的用户
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('student_id, name, can_self_schedule, has_used_self_schedule, self_schedule_deadline')
      .eq('can_self_schedule', true)
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.error('❌ 找不到有自主设定权限的用户:', userError);
      return;
    }
    
    const testUser = users[0];
    console.log('📋 测试用户:', testUser);
    
    // 测试学员自主设定API
    console.log('\n🌐 测试学员自主设定API...');
    
    const response = await fetch('http://localhost:3006/api/student/self-schedule', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.student_id}`
      }
    });
    
    console.log('API状态:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ API响应成功:', data);
    } else {
      const text = await response.text();
      console.log('❌ API响应失败:', text);
    }
    
    // 测试管理员API（需要管理员用户）
    console.log('\n🔍 查找管理员用户...');
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('student_id, name, role')
      .eq('role', 'admin')
      .limit(1);
    
    if (adminError || !admins || admins.length === 0) {
      console.log('⚠️  没有找到管理员用户，跳过管理员API测试');
    } else {
      const adminUser = admins[0];
      console.log('📋 管理员用户:', adminUser);
      
      const adminResponse = await fetch('http://localhost:3006/api/admin/self-schedule-permission', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminUser.student_id}`
        }
      });
      
      console.log('管理员API状态:', adminResponse.status);
      
      if (adminResponse.status === 200) {
        const adminData = await adminResponse.json();
        console.log('✅ 管理员API响应成功:', adminData);
      } else {
        const adminText = await adminResponse.text();
        console.log('❌ 管理员API响应失败:', adminText);
      }
    }
    
  } catch (error) {
    console.error('💥 测试过程中发生错误:', error);
  }
}

testSpecificUser();
