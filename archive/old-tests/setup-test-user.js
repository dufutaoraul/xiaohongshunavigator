// 设置测试用户数据的脚本
const { createClient } = require('@supabase/supabase-js')

// 配置 Supabase
const supabaseUrl = 'https://jwfthdjxmqexsvzyiral.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZnRoZGp4bXFleHN2enlpcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3MzI0NDksImV4cCI6MjA0OTMwODQ0OX0.HFgKG_lx-_dqfDbNPVVYKgjQ3TlGU6jGQxtgTLkRcTk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupTestUser() {
  try {
    console.log('🔍 检查测试用户是否存在...')
    
    // 检查用户是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', 'AXCF2025040088')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ 检查用户时出错:', checkError)
      return
    }

    if (existingUser) {
      console.log('✅ 测试用户已存在:', existingUser)
      return existingUser
    }

    console.log('🆕 创建测试用户...')
    
    // 创建测试用户
    const testUser = {
      student_id: 'AXCF2025040088',
      persona: 'AI学习达人，专注效率提升和工具分享',
      keywords: 'AI工具,效率提升,学习方法',
      vision: '90天后成为AI应用专家，帮助更多人提升工作效率'
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single()

    if (insertError) {
      console.error('❌ 创建用户时出错:', insertError)
      return
    }

    console.log('✅ 测试用户创建成功:', newUser)
    return newUser

  } catch (error) {
    console.error('💥 脚本执行出错:', error)
  }
}

// 运行脚本
setupTestUser().then(() => {
  console.log('🎯 用户设置完成！')
  process.exit(0)
})