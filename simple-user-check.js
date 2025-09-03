const { createClient } = require('@supabase/supabase-js');

const devSupabase = createClient(
  'https://edoljoofbxinghqidgmr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkb2xqb29mYnhpbmdocWlkZ21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMzcxNCwiZXhwIjoyMDcwNDg5NzE0fQ.aN3NjbYp-57tUsK7OXvNFpPevTPZ1eO9ci9oTcVjEQ4'
);

async function checkUser() {
  console.log('🔍 检查AXCF2025010006用户...');
  
  const { data, error } = await devSupabase
    .from('users')
    .select('student_id, name, role')
    .eq('student_id', 'AXCF2025010006')
    .single();

  if (error) {
    console.error('❌ 查询失败:', error);
    return;
  }

  console.log('✅ 用户信息:');
  console.log(`  学号: ${data.student_id}`);
  console.log(`  姓名: ${data.name}`);
  console.log(`  角色: ${data.role}`);
  console.log(`  是否管理员: ${data.role === 'admin' ? '是' : '否'}`);
}

checkUser().catch(console.error);
