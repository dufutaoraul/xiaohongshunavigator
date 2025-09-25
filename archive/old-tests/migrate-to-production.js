const { createClient } = require('@supabase/supabase-js')

// 开发数据库（源数据库）
const devSupabase = createClient(
  'https://edoljoofbxinghqidgmr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkb2xqb29mYnhpbmdocWlkZ21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMzcxNCwiZXhwIjoyMDcwNDg5NzE0fQ.aN3NjbYp-57tUsK7OXvNFpPevTPZ1eO9ci9oTcVjEQ4'
)

// 生产数据库（目标数据库）- 请替换为正确的 Service Role Key
const prodSupabase = createClient(
  'https://jwfthdjxmqexsvzyiral.supabase.co',
  'YOUR_PRODUCTION_SERVICE_ROLE_KEY_HERE'  // 需要从 Vercel 环境变量中获取
)

async function migrateUsersToProduction() {
  try {
    console.log('🔄 开始将用户数据迁移到生产数据库...')
    
    // 1. 从开发数据库获取所有用户数据
    const { data: devUsers, error: devError } = await devSupabase
      .from('users')
      .select('*')
    
    if (devError) {
      console.error('❌ 获取开发数据库用户数据失败:', devError)
      return
    }
    
    console.log(`📊 开发数据库中找到 ${devUsers.length} 个用户`)
    
    // 2. 检查生产数据库中已存在的用户
    const { data: existingUsers, error: existingError } = await prodSupabase
      .from('users')
      .select('student_id')
    
    if (existingError) {
      console.error('❌ 检查生产数据库现有用户失败:', existingError)
      return
    }
    
    const existingStudentIds = new Set(existingUsers?.map(u => u.student_id) || [])
    console.log(`📊 生产数据库中已有 ${existingStudentIds.size} 个用户`)
    
    // 3. 过滤出需要迁移的用户
    const usersToMigrate = devUsers.filter(user => !existingStudentIds.has(user.student_id))
    
    console.log(`🆕 需要迁移 ${usersToMigrate.length} 个新用户`)
    
    // 4. 批量插入新用户
    if (usersToMigrate.length > 0) {
      const { error: insertError } = await prodSupabase
        .from('users')
        .insert(usersToMigrate)
      
      if (insertError) {
        console.error('❌ 插入用户数据到生产数据库失败:', insertError)
        return
      }
      
      console.log(`✅ 成功迁移 ${usersToMigrate.length} 个用户到生产数据库`)
    } else {
      console.log('ℹ️ 没有新用户需要迁移')
    }
    
    console.log('✅ 用户数据迁移到生产数据库完成')
    
  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error)
  }
}

async function migrateAssignmentsToProduction() {
  try {
    console.log('🔄 开始将作业数据迁移到生产数据库...')
    
    // 1. 从开发数据库获取所有作业数据
    const { data: devAssignments, error: devError } = await devSupabase
      .from('assignments')
      .select('*')
    
    if (devError) {
      console.error('❌ 获取开发数据库作业数据失败:', devError)
      return
    }
    
    console.log(`📊 开发数据库中找到 ${devAssignments.length} 个作业`)
    
    // 2. 检查生产数据库中已存在的作业
    const { data: existingAssignments, error: existingError } = await prodSupabase
      .from('assignments')
      .select('assignment_id')
    
    if (existingError) {
      console.error('❌ 检查生产数据库现有作业失败:', existingError)
      return
    }
    
    const existingAssignmentIds = new Set(existingAssignments?.map(a => a.assignment_id) || [])
    console.log(`📊 生产数据库中已有 ${existingAssignmentIds.size} 个作业`)
    
    // 3. 过滤出需要迁移的作业
    const assignmentsToMigrate = devAssignments.filter(assignment => 
      !existingAssignmentIds.has(assignment.assignment_id)
    )
    
    console.log(`🆕 需要迁移 ${assignmentsToMigrate.length} 个新作业`)
    
    // 4. 批量插入新作业
    if (assignmentsToMigrate.length > 0) {
      const { error: insertError } = await prodSupabase
        .from('assignments')
        .insert(assignmentsToMigrate)
      
      if (insertError) {
        console.error('❌ 插入作业数据到生产数据库失败:', insertError)
        return
      }
      
      console.log(`✅ 成功迁移 ${assignmentsToMigrate.length} 个作业到生产数据库`)
    } else {
      console.log('ℹ️ 没有新作业需要迁移')
    }
    
    console.log('✅ 作业数据迁移到生产数据库完成')
    
  } catch (error) {
    console.error('❌ 迁移作业过程中发生错误:', error)
  }
}

async function main() {
  console.log('🚀 开始数据迁移到生产数据库...')
  await migrateUsersToProduction()
  await migrateAssignmentsToProduction()
  console.log('🎉 数据迁移到生产数据库完成！')
}

// 运行迁移
if (require.main === module) {
  main()
}

module.exports = { migrateUsersToProduction, migrateAssignmentsToProduction }
