const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateAXCFPermissions() {
  try {
    console.log('🔍 查找AXCF202505开头的学员...')
    
    // 查找所有AXCF202505开头的学员
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('student_id, name, can_self_schedule, self_schedule_deadline, created_at')
      .like('student_id', 'AXCF202505%')

    if (fetchError) {
      console.error('❌ 查询用户失败:', fetchError)
      return
    }

    if (!users || users.length === 0) {
      console.log('📝 没有找到AXCF202505开头的学员')
      return
    }

    console.log(`📊 找到 ${users.length} 个AXCF202505开头的学员`)

    let updatedCount = 0
    let alreadyHasPermission = 0

    for (const user of users) {
      console.log(`\n👤 处理学员: ${user.student_id} (${user.name})`)
      
      if (user.can_self_schedule) {
        console.log('  ✅ 已有自主设定权限，跳过')
        alreadyHasPermission++
        continue
      }

      // 计算截止日期：用户创建时间 + 6个月
      const createdAt = new Date(user.created_at)
      const deadline = new Date(createdAt)
      deadline.setMonth(deadline.getMonth() + 6)

      console.log(`  📅 创建时间: ${createdAt.toISOString().split('T')[0]}`)
      console.log(`  📅 截止时间: ${deadline.toISOString().split('T')[0]}`)

      // 更新用户权限
      const { error: updateError } = await supabase
        .from('users')
        .update({
          can_self_schedule: true,
          self_schedule_deadline: deadline.toISOString()
        })
        .eq('student_id', user.student_id)

      if (updateError) {
        console.error(`  ❌ 更新失败:`, updateError)
      } else {
        console.log('  ✅ 权限更新成功')
        updatedCount++
      }
    }

    console.log('\n📊 更新完成统计:')
    console.log(`  - 总学员数: ${users.length}`)
    console.log(`  - 已有权限: ${alreadyHasPermission}`)
    console.log(`  - 新增权限: ${updatedCount}`)
    console.log(`  - 失败数量: ${users.length - alreadyHasPermission - updatedCount}`)

  } catch (error) {
    console.error('❌ 批量更新失败:', error)
  }
}

// 运行更新
updateAXCFPermissions()
