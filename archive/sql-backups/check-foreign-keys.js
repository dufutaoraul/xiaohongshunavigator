const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://edoljoofbxinghqidgmr.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkb2xqb29mYnhpbmdocWlkZ21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMzcxNCwiZXhwIjoyMDcwNDg5NzE0fQ.aN3NjbYp-57tUsK7OXvNFpPevTPZ1eO9ci9oTcVjEQ4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkForeignKeys() {
  console.log('🔍 检查外键约束和数据一致性...')
  
  // 1. 检查 users 表中的 student_id
  console.log('\n👥 检查 users 表中的 student_id:')
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('student_id, name')
      .order('student_id')
    
    if (usersError) {
      console.log(`❌ 查询 users 表失败: ${usersError.message}`)
    } else {
      console.log(`✅ 找到 ${users.length} 个用户:`)
      users.forEach(user => {
        console.log(`   - ${user.student_id}: ${user.name}`)
      })
    }
  } catch (err) {
    console.log(`❌ 检查 users 表时发生错误: ${err.message}`)
  }
  
  // 2. 检查 checkin_schedules 表中的 student_id
  console.log('\n📅 检查 checkin_schedules 表中的 student_id:')
  try {
    const { data: schedules, error: schedulesError } = await supabase
      .from('checkin_schedules')
      .select('student_id, start_date, end_date')
      .order('student_id')
    
    if (schedulesError) {
      console.log(`❌ 查询 checkin_schedules 表失败: ${schedulesError.message}`)
    } else {
      console.log(`✅ 找到 ${schedules.length} 个打卡安排:`)
      schedules.forEach(schedule => {
        console.log(`   - ${schedule.student_id}: ${schedule.start_date} 到 ${schedule.end_date}`)
      })
    }
  } catch (err) {
    console.log(`❌ 检查 checkin_schedules 表时发生错误: ${err.message}`)
  }
  
  // 3. 检查数据一致性
  console.log('\n🔗 检查数据一致性:')
  try {
    const { data: users } = await supabase.from('users').select('student_id')
    const { data: schedules } = await supabase.from('checkin_schedules').select('student_id')
    
    if (users && schedules) {
      const userIds = new Set(users.map(u => u.student_id))
      const scheduleIds = schedules.map(s => s.student_id)
      
      const orphanedSchedules = scheduleIds.filter(id => !userIds.has(id))
      const uniqueOrphaned = [...new Set(orphanedSchedules)]
      
      if (uniqueOrphaned.length > 0) {
        console.log(`❌ 发现 ${uniqueOrphaned.length} 个孤立的打卡安排 (student_id 在 users 表中不存在):`)
        uniqueOrphaned.forEach(id => {
          console.log(`   - ${id}`)
        })
      } else {
        console.log(`✅ 所有打卡安排的 student_id 都在 users 表中存在`)
      }
    }
  } catch (err) {
    console.log(`❌ 检查数据一致性时发生错误: ${err.message}`)
  }
  
  // 4. 测试插入一个存在的 student_id
  console.log('\n🧪 测试插入现有用户的打卡安排:')
  try {
    const { data: users } = await supabase
      .from('users')
      .select('student_id')
      .limit(1)
    
    if (users && users.length > 0) {
      const testStudentId = users[0].student_id
      console.log(`使用现有用户 ${testStudentId} 进行测试...`)
      
      const testData = {
        student_id: testStudentId,
        start_date: '2025-01-01',
        end_date: '2025-04-04',
        created_by: 'admin'
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('checkin_schedules')
        .insert(testData)
        .select()
      
      if (insertError) {
        console.log(`❌ 插入失败: ${insertError.message}`)
        console.log(`   详细错误: ${JSON.stringify(insertError, null, 2)}`)
      } else {
        console.log(`✅ 插入成功！`)
        console.log(`   插入的数据: ${JSON.stringify(insertData[0], null, 2)}`)
        
        // 删除测试数据
        await supabase
          .from('checkin_schedules')
          .delete()
          .eq('id', insertData[0].id)
        console.log(`🗑️ 已删除测试数据`)
      }
    }
  } catch (err) {
    console.log(`❌ 测试插入时发生错误: ${err.message}`)
  }
}

checkForeignKeys().catch(console.error)
