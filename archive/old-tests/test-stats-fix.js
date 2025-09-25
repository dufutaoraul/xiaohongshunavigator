// 测试统计逻辑修复

async function testStatsAPI() {
  console.log('🧪 测试统计API修复...\n')

  try {
    const response = await fetch('http://localhost:3001/api/admin/checkin-stats')
    const result = await response.json()
    
    console.log('📥 API统计结果:')
    console.log(`状态码: ${response.status}`)
    console.log('响应数据:', JSON.stringify(result, null, 2))

    if (result.success) {
      console.log('\n📊 统计数据:')
      console.log(`   正在打卡: ${result.activePunches} 人`)
      console.log(`   打卡合格: ${result.qualifiedStudents} 人`)
      console.log(`   未开始: ${result.notStartedStudents} 人`)
      console.log(`   打卡不合格: ${result.forgotStudents} 人`)
      
      console.log('\n✅ API统计修复成功!')
    } else {
      console.log('\n❌ API统计失败:')
      console.log(`   错误: ${result.error}`)
    }

  } catch (error) {
    console.log('\n❌ 请求失败:')
    console.log(`   错误: ${error.message}`)
  }
}

// 运行测试
testStatsAPI().catch(console.error)
