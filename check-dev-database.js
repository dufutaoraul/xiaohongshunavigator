const { createClient } = require('@supabase/supabase-js');

// 开发数据库配置
const devSupabase = createClient(
  'https://edoljoofbxinghqidgmr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkb2xqb29mYnhpbmdocWlkZ21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMzcxNCwiZXhwIjoyMDcwNDg5NzE0fQ.aN3NjbYp-57tUsK7OXvNFpPevTPZ1eO9ci9oTcVjEQ4'
);

async function checkDevDatabase() {
  console.log('🔍 检查开发数据库用户信息...\n');

    // 特别检查 users 表的 role 字段
    console.log(`\n🎯 详细检查 users 表和 AXCF2025010006 用户:`);
    const { data: userData, error: userError } = await devSupabase
      .from('users')
      .select('*')
      .eq('student_id', 'AXCF2025010006')
      .single();

    if (!userError && userData) {
      console.log(`✅ 找到用户 AXCF2025010006:`);
      console.log('用户详细信息:', JSON.stringify(userData, null, 2));
      console.log(`role字段: ${userData.role || '(未设置)'}`);
      console.log(`是否有role字段: ${userData.hasOwnProperty('role') ? '是' : '否'}`);
    } else {
      console.log(`❌ 用户 AXCF2025010006 不存在或查询失败:`, userError);
    }

    // 检查所有用户的role字段
    console.log(`\n👥 检查所有用户的role字段:`);
    const { data: allUsers, error: allUsersError } = await devSupabase
      .from('users')
      .select('student_id, name, role')
      .limit(10);

    if (!allUsersError && allUsers) {
      console.log(`✅ 找到 ${allUsers.length} 个用户:`);
      allUsers.forEach(user => {
        console.log(`  ${user.student_id} - ${user.name} - role: ${user.role || '(null)'}`);
      });
    } else {
      console.log(`❌ 查询用户失败:`, allUsersError);
    }

  } catch (error) {
    console.error('❌ 检查数据库时出错:', error);
  }
}

checkDevDatabase().catch(console.error);
