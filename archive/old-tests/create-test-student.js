const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestStudent() {
  try {
    const studentId = 'AXCF2025050099'
    const studentName = '测试新学员'
    
    console.log(`🔍 检查学员 ${studentId} 是否已存在...`)
    
    // 检查学员是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('student_id')
      .eq('student_id', studentId)
      .single()

    if (existingUser) {
      console.log('✅ 学员已存在，删除后重新创建...')
      
      // 删除现有的打卡安排
      await supabase
        .from('checkin_schedules')
        .delete()
        .eq('student_id', studentId)
      
      // 删除现有用户
      await supabase
        .from('users')
        .delete()
        .eq('student_id', studentId)
    }

    console.log(`📝 创建新学员 ${studentId}...`)
    
    // 创建新学员
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        student_id: studentId,
        name: studentName,
        can_self_schedule: false,  // 初始没有权限，让系统自动授权
        has_used_self_schedule: false,
        self_schedule_deadline: null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ 创建学员失败:', createError)
      return
    }

    console.log('✅ 测试学员创建成功!')
    console.log(`   学员ID: ${studentId}`)
    console.log(`   学员姓名: ${studentName}`)
    console.log(`   自主设定权限: 无（等待自动授权）`)
    console.log(`   创建时间: ${newUser.created_at}`)
    console.log('')
    console.log('🎯 测试步骤:')
    console.log('1. 使用学员ID登录系统')
    console.log('2. 进入打卡中心')
    console.log('3. 系统应该自动授权并显示自主设定选项')
    console.log('4. 选择打卡开始日期')
    console.log('5. 预览下载PDF合同')
    console.log('6. 确认设置')

  } catch (error) {
    console.error('❌ 创建测试学员失败:', error)
  }
}

// 运行创建
createTestStudent()
