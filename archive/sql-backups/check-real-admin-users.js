const { createClient } = require('@supabase/supabase-js')

// 手动读取环境变量
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

console.log('🔧 Environment Check:', {
  supabaseUrl: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  serviceKeyLength: supabaseServiceKey?.length,
  serviceKeyPrefix: supabaseServiceKey?.substring(0, 20) + '...'
})

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRealAdminUsers() {
  try {
    console.log('🔍 Checking all users in database...')
    
    // 查看所有用户
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('student_id, name, role')
      .order('student_id')
    
    if (allError) {
      console.error('❌ Error querying all users:', allError)
      return
    }
    
    console.log('👥 All users in database:')
    allUsers.forEach(user => {
      console.log(`  ${user.student_id} - ${user.name} - ${user.role || 'student'}`)
    })
    
    console.log('\n👑 Admin users:')
    const adminUsers = allUsers.filter(user => user.role === 'admin')
    adminUsers.forEach(user => {
      console.log(`  ✅ ${user.student_id} - ${user.name}`)
    })
    
    if (adminUsers.length === 0) {
      console.log('  ❌ No admin users found!')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkRealAdminUsers()
