// 测试强制更新打卡日期功能

async function testForceUpdate() {
  console.log('🧪 测试强制更新打卡日期功能...\n')

  const testData = {
    mode: 'single',
    student_id: 'AXCF2025010003',
    start_date: '2025-01-20',
    created_by: 'admin',
    force_update: true  // 强制更新
  }

  console.log('📤 发送强制更新请求:')
  console.log(JSON.stringify(testData, null, 2))

  try {
    const response = await fetch('http://localhost:3000/api/admin/checkin-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })

    const result = await response.json()
    
    console.log('\n📥 响应结果:')
    console.log(`状态码: ${response.status}`)
    console.log('响应数据:', JSON.stringify(result, null, 2))

    if (result.success && result.data) {
      const schedule = Array.isArray(result.data) ? result.data[0] : result.data
      console.log('\n✅ 强制更新成功!')
      console.log('📊 新的日期安排:')
      console.log(`   开始日期: ${schedule.start_date}`)
      console.log(`   结束日期: ${schedule.end_date}`)
      
      // 计算天数
      const startDate = new Date(schedule.start_date)
      const endDate = new Date(schedule.end_date)
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      console.log(`   总天数: ${totalDays}`)
      console.log(`   ✅ 天数正确: ${totalDays === 93 ? '是' : '否'}`)
      
      if (totalDays !== 93) {
        console.log(`   ❌ 错误: 应该是93天，实际是${totalDays}天`)
      } else {
        console.log('\n🎉 日期计算修复成功！现在是正确的93天周期。')
      }
    } else {
      console.log('\n❌ 强制更新失败:')
      console.log(`   错误: ${result.error || result.message}`)
    }

  } catch (error) {
    console.log('\n❌ 请求失败:')
    console.log(`   错误: ${error.message}`)
  }
}

// 运行测试
testForceUpdate().catch(console.error)
