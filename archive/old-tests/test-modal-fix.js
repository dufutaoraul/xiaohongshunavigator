// 测试模态框修复
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testModalFix() {
  console.log('🧪 测试模态框修复...')
  
  try {
    // 找一个没有打卡安排但有自主设定权限的用户
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('student_id, name, can_self_schedule, has_used_self_schedule, self_schedule_deadline')
      .eq('can_self_schedule', true)
      .eq('has_used_self_schedule', false)
      .limit(5);
    
    if (userError || !users || users.length === 0) {
      console.error('❌ 找不到有自主设定权限的用户:', userError);
      return;
    }
    
    console.log(`📋 找到 ${users.length} 个有权限的用户`);
    
    for (const user of users) {
      // 检查是否有活跃的打卡安排
      const { data: schedules, error: scheduleError } = await supabase
        .from('checkin_schedules')
        .select('*')
        .eq('student_id', user.student_id)
        .eq('is_active', true);
      
      if (scheduleError) {
        console.error(`❌ 检查用户 ${user.student_id} 的打卡安排失败:`, scheduleError);
        continue;
      }
      
      if (!schedules || schedules.length === 0) {
        console.log(`✅ 用户 ${user.student_id} (${user.name}) 没有活跃的打卡安排！`);
        console.log('📋 用户详情:', user);
        
        // 测试API响应
        console.log('\n🧪 测试API响应...');
        const response = await fetch('http://localhost:3007/api/student/self-schedule', {
          headers: {
            'Authorization': `Bearer ${user.student_id}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ API响应:', data);
          console.log('🎉 这个用户应该能看到自主设定模态框！');
          console.log(`💡 请在浏览器中用学号 ${user.student_id} 登录测试`);
          console.log(`🔗 测试链接: http://localhost:3007/checkin?student_id=${user.student_id}`);
          return;
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
    
  } catch (error) {
    console.error('💥 测试失败:', error);
  }
}

testModalFix();
