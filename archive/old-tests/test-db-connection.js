// 测试数据库连接和用户数据
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://edoljoofbxinghqidgmr.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkb2xqb29mYnhpbmdocWlkZ21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMzcxNCwiZXhwIjoyMDcwNDg5NzE0fQ.aN3NjbYp-57tUsK7OXvNFpPevTPZ1eO9ci9oTcVjEQ4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  try {
    console.log('🔍 测试数据库连接...')
    
    // 1. 检查users表结构
    console.log('\n📋 检查users表结构:')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .order('ordinal_position')
    
    if (columnsError) {
      console.error('❌ 获取表结构失败:', columnsError)
    } else {
      console.table(columns)
    }
    
    // 2. 检查users表中的数据
    console.log('\n👥 检查users表数据:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('student_id, name, password, role')
      .limit(10)
    
    if (usersError) {
      console.error('❌ 获取用户数据失败:', usersError)
    } else {
      console.log(`✅ 找到 ${users.length} 个用户:`)
      users.forEach(user => {
        console.log(`  - ${user.student_id}: ${user.name} (密码: ${user.password ? '已设置' : '未设置'})`)
      })
    }
    
    // 3. 测试特定用户登录
    console.log('\n🔐 测试用户登录:')
    const testUser = 'AXCF2025010019'
    const testPassword = '123456'
    
    const { data: user, error: loginError } = await supabase
      .from('users')
      .select('student_id, name, password, role')
      .eq('student_id', testUser)
      .single()
    
    if (loginError) {
      console.error(`❌ 用户 ${testUser} 不存在:`, loginError)
    } else {
      console.log(`✅ 找到用户 ${testUser}:`, {
        name: user.name,
        hasPassword: !!user.password,
        passwordMatch: user.password === testPassword
      })
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

testConnection()
