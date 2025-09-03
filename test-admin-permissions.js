const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// 手动读取.env.local文件
let supabaseUrl, supabaseServiceKey
try {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  const lines = envContent.split('\n')

  lines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim()
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1].trim()
    }
  })
} catch (error) {
  console.error('❌ 无法读取.env.local文件:', error.message)
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少Supabase配置')
  console.log('SUPABASE_URL:', supabaseUrl ? '✓' : '❌')
  console.log('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✓' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAdminPermissions() {
  try {
    console.log('🔍 检查数据库中的用户权限...')
    
    // 获取所有用户
    const { data: users, error } = await supabase
      .from('users')
      .select('student_id, name, role')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ 查询用户失败:', error)
      return
    }
    
    console.log('\n📊 用户列表:')
    console.log('总用户数:', users.length)
    
    users.forEach(user => {
      const roleIcon = user.role === 'admin' ? '👑' : '👤'
      console.log(`${roleIcon} ${user.student_id} - ${user.name} (${user.role || 'student'})`)
    })
    
    // 统计管理员数量
    const adminUsers = users.filter(user => user.role === 'admin')
    console.log('\n👑 管理员用户数:', adminUsers.length)
    
    if (adminUsers.length === 0) {
      console.log('\n⚠️  没有找到管理员用户！')
      console.log('建议创建一个管理员用户进行测试')
    } else {
      console.log('\n✅ 管理员用户列表:')
      adminUsers.forEach(admin => {
        console.log(`  - ${admin.student_id} (${admin.name})`)
      })
    }
    
  } catch (error) {
    console.error('❌ 检查权限时出错:', error)
  }
}

async function createTestAdmin() {
  try {
    console.log('\n🔧 创建测试管理员用户...')
    
    const testAdmin = {
      student_id: 'admin001',
      name: '测试管理员',
      password: 'admin123',
      role: 'admin'
    }
    
    const { data, error } = await supabase
      .from('users')
      .upsert(testAdmin, { onConflict: 'student_id' })
      .select()
    
    if (error) {
      console.error('❌ 创建管理员失败:', error)
      return
    }
    
    console.log('✅ 测试管理员创建成功!')
    console.log('学号: admin001')
    console.log('密码: admin123')
    console.log('角色: admin')
    
  } catch (error) {
    console.error('❌ 创建管理员时出错:', error)
  }
}

async function main() {
  await checkAdminPermissions()
  
  // 询问是否创建测试管理员
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  rl.question('\n是否创建测试管理员用户? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await createTestAdmin()
    }
    rl.close()
  })
}

main()
