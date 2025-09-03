const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        envVars[key.trim()] = value.trim()
      }
    })
    
    return envVars
  } catch (error) {
    console.error('Error reading .env.local:', error.message)
    return {}
  }
}

const envVars = loadEnvFile()
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserRole() {
  try {
    console.log('🔍 检查AXCF2025010006用户的role字段...')
    
    // 查看特定用户
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', 'AXCF2025010006')
      .single()
    
    if (error) {
      console.error('❌ Error querying user:', error)
      return
    }
    
    console.log('👤 用户详细信息:')
    console.log(JSON.stringify(user, null, 2))
    
    console.log('\n📊 关键字段检查:')
    console.log(`  学号: ${user.student_id}`)
    console.log(`  姓名: ${user.name}`)
    console.log(`  role字段: ${user.role || '(未设置)'}`)
    console.log(`  是否有role字段: ${user.hasOwnProperty('role') ? '是' : '否'}`)
    
    // 检查表结构
    console.log('\n🏗️ 检查users表结构...')
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
    
    if (columnError) {
      console.log('❌ 无法获取表结构，尝试直接查询所有用户的role字段...')
      
      const { data: allUsers, error: allError } = await supabase
        .from('users')
        .select('student_id, name, role')
        .limit(5)
      
      if (allError) {
        console.error('❌ Error querying users:', allError)
      } else {
        console.log('👥 前5个用户的role字段:')
        allUsers.forEach(u => {
          console.log(`  ${u.student_id} - ${u.name} - role: ${u.role || '(null)'}`)
        })
      }
    } else {
      console.log('✅ 表结构获取成功:')
      columns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkUserRole()
