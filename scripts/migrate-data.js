const { createClient } = require('@supabase/supabase-js')

// Master分支数据库（只读）
const masterSupabase = createClient(
  'https://jwfthdjxmqexsvzyiral.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZnRoZGp4bXFleHN2enlpcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzU1NDcsImV4cCI6MjA3MDIxMTU0N30.4bpCHJseDIaxvYs0c7Gk-M0dIVVDuwiGZZztl2nbz-4'
)

// 开发数据库（可写）
const devSupabase = createClient(
  'https://edoljoofbxinghqidgmr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkb2xqb29mYnhpbmdocWlkZ21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMzcxNCwiZXhwIjoyMDcwNDg5NzE0fQ.aN3NjbYp-57tUsK7OXvNFpPevTPZ1eO9ci9oTcVjEQ4'
)

async function migrateUserData() {
  try {
    console.log('🔄 开始迁移用户数据...')
    
    // 1. 从master数据库获取所有用户数据
    const { data: masterUsers, error: masterError } = await masterSupabase
      .from('users')
      .select('*')
    
    if (masterError) {
      console.error('❌ 获取master数据失败:', masterError)
      return
    }
    
    console.log(`📊 找到 ${masterUsers.length} 个用户`)
    
    // 2. 检查开发数据库中已存在的用户
    const { data: existingUsers, error: existingError } = await devSupabase
      .from('users')
      .select('student_id')
    
    if (existingError) {
      console.error('❌ 检查现有用户失败:', existingError)
      return
    }
    
    const existingStudentIds = new Set(existingUsers?.map(u => u.student_id) || [])
    
    // 3. 过滤出需要迁移的用户
    const usersToMigrate = masterUsers.filter(user => !existingStudentIds.has(user.student_id))
    
    console.log(`🆕 需要迁移 ${usersToMigrate.length} 个新用户`)
    
    // 4. 批量插入新用户
    if (usersToMigrate.length > 0) {
      const { error: insertError } = await devSupabase
        .from('users')
        .insert(usersToMigrate)
      
      if (insertError) {
        console.error('❌ 插入用户数据失败:', insertError)
        return
      }
      
      console.log(`✅ 成功迁移 ${usersToMigrate.length} 个用户`)
    }
    
    // 5. 更新已存在用户的数据（除了可能被修改的字段）
    for (const masterUser of masterUsers) {
      if (existingStudentIds.has(masterUser.student_id)) {
        const { error: updateError } = await devSupabase
          .from('users')
          .update({
            name: masterUser.name,
            // 不更新密码，保持开发环境的密码
            // password: masterUser.password,
            xiaohongshu_url: masterUser.xiaohongshu_url,
            created_at: masterUser.created_at
          })
          .eq('student_id', masterUser.student_id)
        
        if (updateError) {
          console.error(`❌ 更新用户 ${masterUser.student_id} 失败:`, updateError)
        }
      }
    }
    
    console.log('✅ 用户数据迁移完成')
    
  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error)
  }
}

async function migrateUserPersonas() {
  try {
    console.log('🔄 开始迁移用户人设数据...')
    
    // 1. 从master数据库获取所有用户人设数据
    const { data: masterPersonas, error: masterError } = await masterSupabase
      .from('user_personas')
      .select('*')
    
    if (masterError) {
      console.error('❌ 获取master人设数据失败:', masterError)
      return
    }
    
    console.log(`📊 找到 ${masterPersonas.length} 个用户人设`)
    
    // 2. 检查开发数据库中已存在的人设
    const { data: existingPersonas, error: existingError } = await devSupabase
      .from('user_personas')
      .select('student_id')
    
    if (existingError) {
      console.error('❌ 检查现有人设失败:', existingError)
      return
    }
    
    const existingPersonaIds = new Set(existingPersonas?.map(p => p.student_id) || [])
    
    // 3. 过滤出需要迁移的人设
    const personasToMigrate = masterPersonas.filter(persona => !existingPersonaIds.has(persona.student_id))
    
    console.log(`🆕 需要迁移 ${personasToMigrate.length} 个新人设`)
    
    // 4. 批量插入新人设
    if (personasToMigrate.length > 0) {
      const { error: insertError } = await devSupabase
        .from('user_personas')
        .insert(personasToMigrate)
      
      if (insertError) {
        console.error('❌ 插入人设数据失败:', insertError)
        return
      }
      
      console.log(`✅ 成功迁移 ${personasToMigrate.length} 个用户人设`)
    }
    
    console.log('✅ 用户人设数据迁移完成')
    
  } catch (error) {
    console.error('❌ 迁移人设过程中发生错误:', error)
  }
}

async function main() {
  console.log('🚀 开始数据迁移...')
  await migrateUserData()
  await migrateUserPersonas()
  console.log('🎉 数据迁移完成！')
}

// 运行迁移
if (require.main === module) {
  main()
}

module.exports = { migrateUserData, migrateUserPersonas }
