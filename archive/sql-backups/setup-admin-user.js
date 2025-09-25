const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// 从环境变量或直接配置 Supabase 连接
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAdminUser() {
  try {
    console.log('🔧 开始设置管理员用户...')
    
    // 管理员用户信息
    const adminData = {
      student_id: 'ADMIN001',
      name: '系统管理员',
      email: 'admin@example.com',
      password: 'admin123456', // 这将被加密
      role: 'admin'
    }
    
    // 检查管理员是否已存在
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('student_id')
      .eq('student_id', adminData.student_id)
      .single()
    
    if (existingAdmin) {
      console.log('✅ 管理员用户已存在:', adminData.student_id)
      return
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(adminData.password, 10)
    
    // 创建管理员用户
    const { data: newAdmin, error: insertError } = await supabase
      .from('users')
      .insert({
        student_id: adminData.student_id,
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        role: adminData.role
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ 创建管理员失败:', insertError)
      return
    }
    
    console.log('✅ 管理员用户创建成功!')
    console.log('📋 登录信息:')
    console.log('   学号:', adminData.student_id)
    console.log('   密码:', adminData.password)
    console.log('   角色:', adminData.role)
    console.log('')
    console.log('🌐 现在可以使用这些凭据登录管理员后台了!')
    
  } catch (error) {
    console.error('❌ 设置管理员用户时出错:', error)
  }
}

// 同时创建一个测试学员用户
async function setupTestStudent() {
  try {
    console.log('👤 开始设置测试学员用户...')
    
    const studentData = {
      student_id: 'AXCF2025040001',
      name: '测试学员',
      email: 'student@example.com',
      password: 'student123456',
      role: 'student'
    }
    
    // 检查学员是否已存在
    const { data: existingStudent, error: checkError } = await supabase
      .from('users')
      .select('student_id')
      .eq('student_id', studentData.student_id)
      .single()
    
    if (existingStudent) {
      console.log('✅ 测试学员用户已存在:', studentData.student_id)
      return
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(studentData.password, 10)
    
    // 创建学员用户
    const { data: newStudent, error: insertError } = await supabase
      .from('users')
      .insert({
        student_id: studentData.student_id,
        name: studentData.name,
        email: studentData.email,
        password: hashedPassword,
        role: studentData.role
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ 创建测试学员失败:', insertError)
      return
    }
    
    console.log('✅ 测试学员用户创建成功!')
    console.log('📋 登录信息:')
    console.log('   学号:', studentData.student_id)
    console.log('   密码:', studentData.password)
    console.log('   角色:', studentData.role)
    
  } catch (error) {
    console.error('❌ 设置测试学员用户时出错:', error)
  }
}

async function main() {
  console.log('🚀 开始设置测试用户...\n')
  
  await setupAdminUser()
  console.log('')
  await setupTestStudent()
  
  console.log('\n🎉 用户设置完成!')
  console.log('💡 提示: 请确保你的 Supabase 数据库中的 users 表已经添加了 role 字段')
}

main().catch(console.error)