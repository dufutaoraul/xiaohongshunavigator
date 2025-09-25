const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://edoljoofbxinghqidgmr.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkb2xqb29mYnhpbmdocWlkZ21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMzcxNCwiZXhwIjoyMDcwNDg5NzE0fQ.aN3NjbYp-57tUsK7OXvNFpPevTPZ1eO9ci9oTcVjEQ4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCheckinTables() {
  console.log('🔍 检查打卡相关表...')
  
  // 检查可能的表名
  const tableNames = [
    'checkin_schedules',
    'checkin_records', 
    'checkin_plans',
    'student_checkins',
    'xhs_checkins'
  ]
  
  for (const tableName of tableNames) {
    console.log(`\n📋 检查表: ${tableName}`)
    
    try {
      // 尝试查询表
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ 表 ${tableName} 不存在或无法访问`)
        console.log(`   错误: ${error.message}`)
        continue
      }
      
      console.log(`✅ 表 ${tableName} 存在`)
      
      if (data && data.length > 0) {
        console.log(`📊 字段结构:`)
        const fields = Object.keys(data[0])
        fields.forEach(field => {
          const value = data[0][field]
          const type = typeof value
          console.log(`    ${field}: ${type} (示例: ${value})`)
        })
      } else {
        console.log(`📊 表为空，尝试插入测试数据查看结构...`)
        
        // 对于 checkin_schedules 表，尝试插入测试数据
        if (tableName === 'checkin_schedules') {
          try {
            const testData = {
              student_id: 'TEST001',
              start_date: '2025-01-01',
              end_date: '2025-04-04',
              created_by: 'admin'
            }
            
            const { data: insertData, error: insertError } = await supabase
              .from('checkin_schedules')
              .insert(testData)
              .select()
            
            if (insertError) {
              console.log(`❌ 插入测试数据失败: ${insertError.message}`)
              console.log(`   详细错误: ${JSON.stringify(insertError, null, 2)}`)
            } else {
              console.log(`✅ 插入测试数据成功`)
              console.log(`📊 字段结构:`)
              if (insertData && insertData.length > 0) {
                const fields = Object.keys(insertData[0])
                fields.forEach(field => {
                  const value = insertData[0][field]
                  const type = typeof value
                  console.log(`    ${field}: ${type} (示例: ${value})`)
                })
              }
              
              // 删除测试数据
              await supabase
                .from('checkin_schedules')
                .delete()
                .eq('student_id', 'TEST001')
            }
          } catch (testError) {
            console.log(`❌ 测试插入时发生错误: ${testError.message}`)
          }
        }
      }
      
      // 获取表的记录数
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (!countError) {
        console.log(`📊 记录数: ${count}`)
      }
      
    } catch (err) {
      console.log(`❌ 检查表 ${tableName} 时发生错误: ${err.message}`)
    }
  }
  
  // 特别检查 checkin_schedules 表的权限
  console.log('\n🔐 检查 checkin_schedules 表权限...')
  try {
    // 尝试各种操作
    const operations = [
      { name: 'SELECT', operation: () => supabase.from('checkin_schedules').select('*').limit(1) },
      { name: 'INSERT', operation: () => supabase.from('checkin_schedules').insert({
        student_id: 'PERM_TEST',
        start_date: '2025-01-01',
        end_date: '2025-04-04',
        created_by: 'admin'
      }).select() },
    ]
    
    for (const op of operations) {
      try {
        const { data, error } = await op.operation()
        if (error) {
          console.log(`❌ ${op.name} 权限: ${error.message}`)
        } else {
          console.log(`✅ ${op.name} 权限: 正常`)
          
          // 如果是插入操作成功，删除测试数据
          if (op.name === 'INSERT' && data && data.length > 0) {
            await supabase
              .from('checkin_schedules')
              .delete()
              .eq('student_id', 'PERM_TEST')
          }
        }
      } catch (err) {
        console.log(`❌ ${op.name} 权限测试失败: ${err.message}`)
      }
    }
  } catch (err) {
    console.log(`❌ 权限检查失败: ${err.message}`)
  }
}

checkCheckinTables().catch(console.error)
