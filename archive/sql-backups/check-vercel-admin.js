// 🔍 Vercel管理员账户诊断脚本
// 用途：检查Vercel环境下的管理员认证问题

console.log('🔍 开始诊断Vercel管理员账户问题...\n')

// 1. 检查环境变量
console.log('1️⃣ 检查环境变量:')
const requiredEnvs = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
]

requiredEnvs.forEach(env => {
  const value = process.env[env]
  console.log(`   ${env}: ${value ? '✅ 已配置' : '❌ 未配置'}`)
  if (value) {
    console.log(`     值: ${value.substring(0, 20)}...`)
  }
})

// 2. 测试数据库连接
console.log('\n2️⃣ 测试数据库连接:')

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const { createClient } = require('@supabase/supabase-js')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // 测试连接
  supabase
    .from('users')
    .select('count')
    .then(({ data, error }) => {
      if (error) {
        console.log('   ❌ 数据库连接失败:', error.message)
      } else {
        console.log('   ✅ 数据库连接正常')
      }
    })

  // 检查管理员用户
  supabase
    .from('users')
    .select('student_id, name, role')
    .eq('role', 'admin')
    .then(({ data, error }) => {
      if (error) {
        console.log('   ❌ 管理员查询失败:', error.message)
      } else {
        console.log('   📊 管理员账户数量:', data.length)
        data.forEach(admin => {
          console.log(`     - ${admin.student_id}: ${admin.name}`)
        })
      }
    })
} else {
  console.log('   ❌ 缺少必要的环境变量，无法测试连接')
}

// 3. 检查当前环境
console.log('\n3️⃣ 当前环境信息:')
console.log(`   Node.js版本: ${process.version}`)
console.log(`   环境类型: ${process.env.NODE_ENV || 'development'}`)
console.log(`   平台: ${process.platform}`)

// 4. 提供解决建议
console.log('\n💡 解决建议:')
console.log('   1. 确保Vercel后台已配置所有环境变量')
console.log('   2. 检查管理员账户的role字段是否为"admin"')
console.log('   3. 验证Supabase服务是否正常运行')
console.log('   4. 检查网络连接和防火墙设置')

console.log('\n✅ 诊断完成！')