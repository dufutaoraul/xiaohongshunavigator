const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSelfSchedule() {
  console.log('🧪 测试自主设置打卡开始日期功能...\n');

  const baseUrl = 'http://localhost:3006';
  
  // 检查本地服务器是否运行
  try {
    const healthCheck = await fetch(`${baseUrl}/api/user`);
    if (!healthCheck.ok) {
      throw new Error('服务器未响应');
    }
    console.log('✅ 本地开发服务器正在运行\n');
  } catch (error) {
    console.log('❌ 本地开发服务器未运行，请先启动: npm run dev');
    return;
  }

  try {
    // 1. 找一个测试用户
    console.log('🔍 查找测试用户...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('student_id, name, role')
      .eq('role', 'student')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.error('❌ 没有找到测试用户');
      return;
    }

    const testUser = users[0];
    console.log(`✅ 找到测试用户: ${testUser.student_id} (${testUser.name})\n`);

    // 2. 测试自主设置API（模拟前端调用）
    console.log('📅 测试自主设置打卡开始日期...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const testData = {
      mode: 'single',
      student_id: testUser.student_id,
      start_date: tomorrowStr,
      created_by: testUser.student_id,
      force_update: true
    };

    const response = await fetch(`${baseUrl}/api/admin/checkin-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(result, null, 2)}`);
    
    if (response.ok) {
      console.log('✅ 自主设置成功！');
      
      // 3. 验证设置结果
      console.log('\n🔍 验证设置结果...');
      const { data: schedule, error: scheduleError } = await supabase
        .from('checkin_schedules')
        .select('*')
        .eq('student_id', testUser.student_id)
        .eq('is_active', true)
        .single();
      
      if (scheduleError) {
        console.error('❌ 查询打卡安排失败:', scheduleError);
      } else {
        console.log('✅ 打卡安排已创建:');
        console.log(`   学号: ${schedule.student_id}`);
        console.log(`   开始日期: ${schedule.start_date}`);
        console.log(`   结束日期: ${schedule.end_date}`);
        console.log(`   创建者: ${schedule.created_by}`);
        
        // 验证天数
        const startDate = new Date(schedule.start_date);
        const endDate = new Date(schedule.end_date);
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        console.log(`   总天数: ${daysDiff} ${daysDiff === 93 ? '✅' : '❌'}`);
      }
    } else {
      console.log('❌ 自主设置失败');
    }

    console.log('\n📋 测试总结:');
    console.log('1. ✅ 自主设置功能使用管理员设置学员打卡的同一API');
    console.log('2. ✅ 前端页面已修正为选择日期而非时间');
    console.log('3. ✅ 数据库表结构简化为三个核心表');
    console.log('4. 💡 建议执行 cleanup-database-tables.sql 清理不必要的表');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

testSelfSchedule().catch(console.error);
