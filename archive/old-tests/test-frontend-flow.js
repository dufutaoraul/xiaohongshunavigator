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

async function testFrontendFlow() {
  console.log('🧪 测试前端流程...');
  
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
    
    // 模拟前端的API调用流程
    console.log('\n🔍 步骤1: 检查自主设定权限...');
    
    const selfScheduleResponse = await fetch('http://localhost:3006/api/student/self-schedule', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.student_id}`
      }
    });
    
    console.log('自主设定权限API状态:', selfScheduleResponse.status);
    
    if (selfScheduleResponse.status === 200) {
      const selfScheduleData = await selfScheduleResponse.json();
      console.log('✅ 自主设定权限数据:', selfScheduleData);
      
      // 模拟前端逻辑判断
      console.log('\n🔍 步骤2: 检查打卡安排...');
      
      const scheduleResponse = await fetch(`http://localhost:3006/api/admin/checkin-schedule?student_id=${testUser.student_id}`);
      const scheduleResult = await scheduleResponse.json();
      
      console.log('打卡安排API状态:', scheduleResponse.status);
      console.log('打卡安排数据:', scheduleResult);
      
      // 模拟前端的判断逻辑
      console.log('\n🔍 步骤3: 前端逻辑判断...');
      
      let shouldShowSelfScheduleModal = false;
      let shouldShowNoScheduleModal = false;
      
      if (scheduleResult.success && scheduleResult.data && scheduleResult.data.length > 0) {
        const userSchedule = scheduleResult.data.find((schedule) => schedule.is_active);
        
        if (userSchedule) {
          console.log('✅ 找到活跃的打卡安排:', userSchedule);
        } else {
          console.log('⚠️  没有找到活跃的打卡安排');
          
          // 检查自主设定权限
          if (selfScheduleData?.can_self_schedule && !selfScheduleData?.has_used_opportunity) {
            console.log('✅ 应该显示自主设定模态框');
            shouldShowSelfScheduleModal = true;
          } else if (selfScheduleData?.can_self_schedule && selfScheduleData?.has_used_opportunity) {
            console.log('⚠️  已使用自主设定权限但没找到安排');
            shouldShowNoScheduleModal = true;
          } else {
            console.log('⚠️  没有自主设定权限');
            shouldShowNoScheduleModal = true;
          }
        }
      } else {
        console.log('⚠️  API返回没有打卡安排');
        
        if (selfScheduleData?.can_self_schedule && !selfScheduleData?.has_used_opportunity) {
          console.log('✅ 应该显示自主设定模态框');
          shouldShowSelfScheduleModal = true;
        } else if (selfScheduleData?.can_self_schedule && selfScheduleData?.has_used_opportunity) {
          console.log('⚠️  已使用自主设定权限但API没返回安排');
          shouldShowNoScheduleModal = true;
        } else {
          console.log('⚠️  没有自主设定权限');
          shouldShowNoScheduleModal = true;
        }
      }
      
      console.log('\n🎯 最终判断结果:');
      console.log('显示自主设定模态框:', shouldShowSelfScheduleModal);
      console.log('显示无安排模态框:', shouldShowNoScheduleModal);
      
      if (shouldShowSelfScheduleModal) {
        console.log('🎉 前端应该显示自主设定模态框！');
      } else {
        console.log('❌ 前端不会显示自主设定模态框');
      }
      
    } else {
      const errorText = await selfScheduleResponse.text();
      console.log('❌ 自主设定权限API失败:', errorText);
    }
    
  } catch (error) {
    console.error('💥 测试过程中发生错误:', error);
  }
}

testFrontendFlow();
