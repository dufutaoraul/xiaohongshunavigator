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

async function enableSelfScheduleForUser(studentId) {
  console.log(`🔧 为用户 ${studentId} 开启自主设定权限...`);
  
  try {
    // 计算截止时间（当前时间+6个月）
    const now = new Date();
    const deadline = new Date(now);
    deadline.setMonth(deadline.getMonth() + 6);
    
    const { data, error } = await supabase
      .from('users')
      .update({
        can_self_schedule: true,
        self_schedule_deadline: deadline.toISOString(),
        has_used_self_schedule: false
      })
      .eq('student_id', studentId)
      .select('student_id, name, can_self_schedule, self_schedule_deadline');
    
    if (error) {
      console.error('❌ 更新失败:', error);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('✅ 成功开启自主设定权限:', data[0]);
      return true;
    } else {
      console.log('❌ 用户不存在:', studentId);
      return false;
    }
    
  } catch (error) {
    console.error('💥 操作失败:', error);
    return false;
  }
}

// 从命令行参数获取学号，或使用默认值
const studentId = process.argv[2];

if (!studentId) {
  console.log('❌ 请提供学号参数');
  console.log('用法: node enable-self-schedule.js <学号>');
  console.log('例如: node enable-self-schedule.js AXCF2025010001');
  process.exit(1);
}

enableSelfScheduleForUser(studentId).then(success => {
  if (success) {
    console.log('\n🎉 权限开启成功！现在可以测试自主设定功能了。');
    console.log('💡 请刷新浏览器页面重新测试。');
  } else {
    console.log('\n❌ 权限开启失败，请检查学号是否正确。');
  }
});
