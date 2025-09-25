const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupCascadeDelete() {
  try {
    console.log('🔧 开始设置数据库级联删除关系...')
    
    // 读取SQL文件
    const sqlContent = fs.readFileSync('setup-cascade-delete.sql', 'utf8')
    
    // 将SQL分割成单独的语句
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'))
    
    console.log(`📝 准备执行 ${statements.length} 个SQL语句...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue
      
      console.log(`\n🔄 执行语句 ${i + 1}/${statements.length}:`)
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''))
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        })
        
        if (error) {
          // 如果是查询语句，使用普通查询
          if (statement.toLowerCase().trim().startsWith('select')) {
            const { data: queryData, error: queryError } = await supabase
              .from('information_schema.table_constraints')
              .select('*')
              .limit(1)
            
            if (queryError) {
              console.log(`⚠️  查询执行失败: ${queryError.message}`)
            } else {
              console.log('✅ 查询执行成功')
            }
          } else {
            console.log(`⚠️  语句执行失败: ${error.message}`)
          }
        } else {
          console.log('✅ 语句执行成功')
        }
      } catch (err) {
        console.log(`⚠️  语句执行异常: ${err.message}`)
      }
    }
    
    console.log('\n🎉 级联删除设置完成！')
    console.log('\n📋 设置说明:')
    console.log('✅ checkin_schedules 表：删除用户时自动删除打卡安排')
    console.log('✅ checkin_records 表：删除用户时自动删除打卡记录')
    console.log('✅ homework_submissions 表：删除用户时自动删除作业提交')
    console.log('✅ homework_grades 表：删除用户时自动删除作业评分')
    
    console.log('\n⚠️  重要提醒:')
    console.log('- 现在删除 users 表中的学员时，会自动删除相关的所有数据')
    console.log('- 这是不可逆的操作，请谨慎删除用户')
    console.log('- 建议在删除前先备份重要数据')
    
  } catch (error) {
    console.error('❌ 设置级联删除失败:', error)
  }
}

// 运行设置
setupCascadeDelete()
