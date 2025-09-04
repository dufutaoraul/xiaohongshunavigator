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

async function findTestUser() {
  console.log('🔍 寻找合适的测试用户...');
  
  try {
    // 找所有有自主设定权限的用户
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('student_id, name, can_self_schedule, has_used_self_schedule, self_schedule_deadline')
      .eq('can_self_schedule', true);
    
    if (userError) {
      console.error('❌ 查询用户失败:', userError);
      return;
    }
    
    console.log(`📋 找到 ${users.length} 个有自主设定权限的用户`);
    
    // 检查每个用户是否有活跃的打卡安排
    for (const user of users) {
      console.log(`\n🔍 检查用户: ${user.student_id} (${user.name})`);
      
      // 检查是否有活跃的打卡安排
      const { data: schedules, error: scheduleError } = await supabase
        .from('checkin_schedules')
        .select('*')
        .eq('student_id', user.student_id)
        .eq('is_active', true);
      
      if (scheduleError) {
        console.error(`❌ 查询 ${user.student_id} 的打卡安排失败:`, scheduleError);
        continue;
      }
      
      if (schedules.length === 0) {
        console.log(`✅ 用户 ${user.student_id} (${user.name}) 没有活跃的打卡安排！`);
        console.log('📋 用户详情:', user);
        
        // 测试这个用户的API
        console.log('\n🧪 测试API响应...');
        
        const response = await fetch('http://localhost:3006/api/student/self-schedule', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.student_id}`
          }
        });
        
        if (response.status === 200) {
          const data = await response.json();
          console.log('✅ API响应:', data);
          
          if (data.can_self_schedule && !data.has_used_opportunity) {
            console.log('🎉 这个用户应该能看到自主设定模态框！');
            console.log(`\n💡 请在浏览器中用学号 ${user.student_id} 登录测试`);
            return;
          }
        } else {
          console.log('❌ API响应失败:', response.status);
        }
      } else {
        console.log(`⚠️  用户 ${user.student_id} 有 ${schedules.length} 个活跃的打卡安排`);
        schedules.forEach(schedule => {
          console.log(`   - 安排: ${schedule.start_date} 到 ${schedule.end_date} (${schedule.schedule_type})`);
        });
      }
    }
    
    console.log('\n❌ 没有找到合适的测试用户（有自主设定权限但没有活跃打卡安排）');
    
    // 创建一个测试用户
    console.log('\n💡 建议：为一个现有用户开启自主设定权限进行测试');
    
    // 找一个没有自主设定权限且没有打卡安排的用户
    const { data: candidateUsers, error: candidateError } = await supabase
      .from('users')
      .select('student_id, name, can_self_schedule')
      .eq('can_self_schedule', false)
      .limit(5);
    
    if (!candidateError && candidateUsers.length > 0) {
      console.log('\n📋 可以开启自主设定权限的候选用户:');
      for (const candidate of candidateUsers) {
        // 检查是否有打卡安排
        const { data: candidateSchedules } = await supabase
          .from('checkin_schedules')
          .select('*')
          .eq('student_id', candidate.student_id)
          .eq('is_active', true);
        
        if (!candidateSchedules || candidateSchedules.length === 0) {
          console.log(`   - ${candidate.student_id} (${candidate.name}) - 无活跃打卡安排`);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 查找过程中发生错误:', error);
  }
}

findTestUser();
