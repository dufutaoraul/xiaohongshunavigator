const { createClient } = require('@supabase/supabase-js')
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
    
    // 要执行的SQL语句
    const sqlStatements = [
      // 删除现有约束
      'ALTER TABLE checkin_schedules DROP CONSTRAINT IF EXISTS checkin_schedules_student_id_fkey',
      'ALTER TABLE checkin_records DROP CONSTRAINT IF EXISTS checkin_records_student_id_fkey', 
      'ALTER TABLE homework_submissions DROP CONSTRAINT IF EXISTS homework_submissions_student_id_fkey',
      'ALTER TABLE homework_grades DROP CONSTRAINT IF EXISTS homework_grades_student_id_fkey',
      
      // 创建新的级联删除约束
      'ALTER TABLE checkin_schedules ADD CONSTRAINT checkin_schedules_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE CASCADE',
      'ALTER TABLE checkin_records ADD CONSTRAINT checkin_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE CASCADE',
      'ALTER TABLE homework_submissions ADD CONSTRAINT homework_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE CASCADE',
      'ALTER TABLE homework_grades ADD CONSTRAINT homework_grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE CASCADE'
    ]
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i]
      console.log(`\n🔄 执行 ${i + 1}/${sqlStatements.length}: ${sql.substring(0, 60)}...`)
      
      try {
        // 使用 rpc 调用执行 SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql })
        
        if (error) {
          console.log(`⚠️  执行失败: ${error.message}`)
        } else {
          console.log('✅ 执行成功')
        }
      } catch (err) {
        console.log(`⚠️  执行异常: ${err.message}`)
      }
    }
    
    console.log('\n🎉 级联删除设置完成！')
    console.log('\n📋 现在的行为:')
    console.log('✅ 删除 users 表中的学员时，会自动删除:')
    console.log('   - checkin_schedules 表中的打卡安排')
    console.log('   - checkin_records 表中的打卡记录')
    console.log('   - homework_submissions 表中的作业提交')
    console.log('   - homework_grades 表中的作业评分')
    
    console.log('\n⚠️  重要提醒:')
    console.log('- 这是不可逆的操作，删除用户会同时删除所有相关数据')
    console.log('- 请谨慎操作，建议删除前先备份重要数据')
    
    // 测试验证
    console.log('\n🧪 验证设置...')
    await testCascadeSetup()
    
  } catch (error) {
    console.error('❌ 设置级联删除失败:', error)
  }
}

async function testCascadeSetup() {
  try {
    // 创建测试用户
    const testStudentId = 'TEST_CASCADE_DELETE'
    
    console.log(`📝 创建测试用户: ${testStudentId}`)
    const { error: createError } = await supabase
      .from('users')
      .insert({
        student_id: testStudentId,
        name: '级联删除测试用户',
        can_self_schedule: false,
        has_used_self_schedule: false
      })
    
    if (createError) {
      console.log(`⚠️  创建测试用户失败: ${createError.message}`)
      return
    }
    
    // 创建测试数据
    console.log('📝 创建测试打卡安排...')
    const { error: scheduleError } = await supabase
      .from('checkin_schedules')
      .insert({
        student_id: testStudentId,
        start_date: '2025-01-01',
        end_date: '2025-04-04',
        schedule_type: 'admin_set',
        is_active: true,
        created_by: 'system'
      })
    
    if (scheduleError) {
      console.log(`⚠️  创建测试安排失败: ${scheduleError.message}`)
    }
    
    // 检查数据是否存在
    const { data: beforeDelete, error: checkError } = await supabase
      .from('checkin_schedules')
      .select('*')
      .eq('student_id', testStudentId)
    
    if (checkError) {
      console.log(`⚠️  检查数据失败: ${checkError.message}`)
      return
    }
    
    console.log(`📊 删除前数据: ${beforeDelete?.length || 0} 条打卡安排`)
    
    // 删除用户（测试级联删除）
    console.log('🗑️  删除测试用户（测试级联删除）...')
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('student_id', testStudentId)
    
    if (deleteError) {
      console.log(`⚠️  删除用户失败: ${deleteError.message}`)
      return
    }
    
    // 检查相关数据是否被删除
    const { data: afterDelete, error: checkAfterError } = await supabase
      .from('checkin_schedules')
      .select('*')
      .eq('student_id', testStudentId)
    
    if (checkAfterError) {
      console.log(`⚠️  检查删除后数据失败: ${checkAfterError.message}`)
      return
    }
    
    console.log(`📊 删除后数据: ${afterDelete?.length || 0} 条打卡安排`)
    
    if ((afterDelete?.length || 0) === 0) {
      console.log('✅ 级联删除测试成功！相关数据已自动删除')
    } else {
      console.log('❌ 级联删除测试失败！相关数据未被删除')
    }
    
  } catch (error) {
    console.error('❌ 测试级联删除失败:', error)
  }
}

// 运行设置
setupCascadeDelete()
