const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugStudentSchedule() {
  try {
    console.log('🔍 查询所有学员的打卡安排...\n')
    
    // 查询所有打卡安排
    const { data: schedules, error: scheduleError } = await supabase
      .from('checkin_schedules')
      .select('*')
      .order('created_at', { ascending: false })

    if (scheduleError) {
      console.error('❌ 查询打卡安排失败:', scheduleError)
      return
    }

    console.log(`📊 找到 ${schedules?.length || 0} 个打卡安排:\n`)

    if (schedules && schedules.length > 0) {
      schedules.forEach((schedule, index) => {
        console.log(`${index + 1}. 学员: ${schedule.student_id}`)
        console.log(`   开始日期: ${schedule.start_date}`)
        console.log(`   结束日期: ${schedule.end_date}`)
        console.log(`   创建者: ${schedule.created_by}`)
        console.log(`   类型: ${schedule.schedule_type}`)
        console.log(`   状态: ${schedule.is_active ? '激活' : '未激活'}`)
        console.log(`   创建时间: ${schedule.created_at}`)
        console.log('')
      })
    }

    // 查询最近的几个学员信息
    console.log('👥 查询最近的学员信息...\n')
    
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('student_id, name, can_self_schedule, has_used_self_schedule, self_schedule_deadline, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (userError) {
      console.error('❌ 查询用户失败:', userError)
      return
    }

    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. 学员: ${user.student_id} (${user.name})`)
        console.log(`   自主设定权限: ${user.can_self_schedule ? '有' : '无'}`)
        console.log(`   已使用机会: ${user.has_used_self_schedule ? '是' : '否'}`)
        console.log(`   截止日期: ${user.self_schedule_deadline || '未设置'}`)
        console.log(`   创建时间: ${user.created_at}`)
        console.log('')
      })
    }

  } catch (error) {
    console.error('❌ 调试失败:', error)
  }
}

// 运行调试
debugStudentSchedule()
