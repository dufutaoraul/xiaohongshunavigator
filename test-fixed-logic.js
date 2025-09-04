// 测试修复后的自主设定逻辑
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFixedLogic() {
  console.log('🧪 测试修复后的自主设定逻辑...\n');
  
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
    
    const response = await fetch('http://localhost:3007/api/student/self-schedule', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.student_id}`
      }
    });
    
    console.log('API响应状态:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API响应数据:', JSON.stringify(data, null, 2));
      
      // 检查关键字段
      console.log('\n🔍 关键字段检查:');
      console.log(`can_self_schedule: ${data.can_self_schedule}`);
      console.log(`has_used_opportunity: ${data.has_used_opportunity}`);
      
      if (data.can_self_schedule && !data.has_used_opportunity) {
        console.log('✅ 逻辑正确：用户有权限且未使用过，应该显示设置界面');
      } else if (data.can_self_schedule && data.has_used_opportunity) {
        console.log('✅ 逻辑正确：用户有权限但已使用过，应该显示已设置信息');
      } else {
        console.log('❌ 逻辑错误：用户明明有权限但API返回无权限');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ API请求失败:', errorText);
    }
    
    // 测试前端页面逻辑
    console.log('\n🖥️  测试前端页面...');
    console.log(`请访问: http://localhost:3007/checkin?student_id=${testUser.student_id}`);
    
  } catch (error) {
    console.error('💥 测试过程中发生错误:', error);
  }
}

testFixedLogic();
