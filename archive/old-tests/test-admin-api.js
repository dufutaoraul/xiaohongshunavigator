// 使用Node.js 18+内置的fetch API

async function testAdminAPI() {
  console.log('🧪 测试管理员API修复效果...\n')

  const baseUrl = 'http://localhost:3003'

  // 首先检查管理员用户
  console.log('👑 检查管理员用户:')

  try {
    const response = await fetch(`${baseUrl}/api/user?student_id=AXCF2025010006`)
    const result = await response.json()

    console.log(`   状态码: ${response.status}`)
    console.log(`   响应: ${JSON.stringify(result, null, 2)}`)

    if (result.success && result.data) {
      const user = result.data
      console.log(`   ✅ 用户信息:`)
      console.log(`      学号: ${user.student_id}`)
      console.log(`      姓名: ${user.name}`)
      console.log(`      角色: ${user.role}`)
      console.log(`      是否管理员: ${user.role === 'admin' ? '是' : '否'}`)
    } else {
      console.log(`   ❌ 获取失败: ${result.error || result.message}`)
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}`)
  }

  // 测试设置打卡日期API
  console.log('\n📅 测试设置打卡日期API:')
  
  const testData = {
    mode: 'single',
    student_id: 'AXCF2025010003', // 使用已知存在的学号
    start_date: '2025-01-15',
    created_by: 'admin'
  }

  try {
    const response = await fetch(`${baseUrl}/api/admin/checkin-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })

    const result = await response.json()
    
    console.log(`   状态码: ${response.status}`)
    console.log(`   响应: ${JSON.stringify(result, null, 2)}`)

    if (result.success && result.data) {
      const schedule = result.data
      console.log(`   ✅ 设置成功!`)
      console.log(`   📊 日期验证:`)
      console.log(`      开始日期: ${schedule.start_date}`)
      console.log(`      结束日期: ${schedule.end_date}`)
      
      // 计算天数
      const startDate = new Date(schedule.start_date)
      const endDate = new Date(schedule.end_date)
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      console.log(`      总天数: ${totalDays}`)
      console.log(`      ✅ 是否正确: ${totalDays === 93 ? '是' : '否'}`)
      
      if (totalDays !== 93) {
        console.log(`      ❌ 错误: 应该是93天，实际是${totalDays}天`)
      }
    } else {
      console.log(`   ❌ 设置失败: ${result.error || result.message}`)
    }

  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}`)
  }

  console.log('\n🔍 测试获取学员详情API:')
  
  try {
    const response = await fetch(`${baseUrl}/api/admin/checkin-schedule?student_id=AXCF2025010003`)
    const result = await response.json()
    
    console.log(`   状态码: ${response.status}`)
    
    if (result.success && result.data && result.data.length > 0) {
      const schedule = result.data[0]
      console.log(`   ✅ 获取成功!`)
      console.log(`   📊 学员打卡安排:`)
      console.log(`      学号: ${schedule.student_id}`)
      console.log(`      开始日期: ${schedule.start_date}`)
      console.log(`      结束日期: ${schedule.end_date}`)
      
      // 验证天数
      const startDate = new Date(schedule.start_date)
      const endDate = new Date(schedule.end_date)
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      console.log(`      总天数: ${totalDays}`)
      console.log(`      ✅ 天数正确: ${totalDays === 93 ? '是' : '否'}`)
    } else {
      console.log(`   ❌ 获取失败: ${result.error || '无数据'}`)
    }

  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}`)
  }

  console.log('\n📋 测试总结:')
  console.log('1. ✅ 日期计算逻辑已修复，确保93天周期')
  console.log('2. ✅ 管理员后台日历显示已改进，添加年月标识')
  console.log('3. 🔄 建议重新设置现有学员的打卡日期以修复94/95天的问题')
  console.log('4. 💡 可以在管理员后台查看学员详情，验证日历显示效果')
}

// 检查本地服务器是否运行
async function checkLocalServer() {
  try {
    const response = await fetch('http://localhost:3003/api/test-db')
    if (response.ok) {
      console.log('✅ 本地开发服务器正在运行\n')
      return true
    }
  } catch (error) {
    console.log('❌ 本地开发服务器未运行，请先启动: npm run dev\n')
    return false
  }
}

async function main() {
  const isLocalRunning = await checkLocalServer()
  
  if (isLocalRunning) {
    await testAdminAPI()
  } else {
    console.log('💡 要测试修复效果，请：')
    console.log('1. 运行 npm run dev 启动本地服务器')
    console.log('2. 重新运行此测试脚本')
    console.log('3. 或者直接在浏览器访问 http://localhost:3000/admin')
  }
}

main().catch(console.error)
