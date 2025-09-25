// 测试批量设置打卡日期功能

async function testBatchUpdate() {
  console.log('🧪 测试批量设置打卡日期功能...\n')

  const testData = {
    mode: 'batch',
    batch_start_id: 'AXCF2025010001',
    batch_end_id: 'AXCF2025010005',
    start_date: '2025-01-25',
    created_by: 'admin',
    force_update: true  // 强制更新
  }

  console.log('📤 发送批量设置请求:')
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
      console.log('\n✅ 批量设置成功!')
      console.log(`📊 设置了 ${result.data.length} 个学员的打卡安排`)
      
      // 验证第一个学员的日期计算
      if (result.data.length > 0) {
        const firstSchedule = result.data[0]
        console.log('\n📅 验证日期计算（第一个学员）:')
        console.log(`   学号: ${firstSchedule.student_id}`)
        console.log(`   开始日期: ${firstSchedule.start_date}`)
        console.log(`   结束日期: ${firstSchedule.end_date}`)
        
        // 计算天数
        const startDate = new Date(firstSchedule.start_date)
        const endDate = new Date(firstSchedule.end_date)
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        
        console.log(`   总天数: ${totalDays}`)
        console.log(`   ✅ 天数正确: ${totalDays === 93 ? '是' : '否'}`)
        
        if (totalDays !== 93) {
          console.log(`   ❌ 错误: 应该是93天，实际是${totalDays}天`)
        } else {
          console.log('\n🎉 批量日期计算修复成功！所有学员都是正确的93天周期。')
        }
      }
    } else {
      console.log('\n❌ 批量设置失败:')
      console.log(`   错误: ${result.error || result.message}`)
      
      if (result.missingStudentIds) {
        console.log(`   缺失的学号: ${result.missingStudentIds.join(', ')}`)
      }
      
      if (result.conflictStudents) {
        console.log(`   冲突的学员: ${result.conflictStudents.length} 个`)
      }
    }

  } catch (error) {
    console.log('\n❌ 请求失败:')
    console.log(`   错误: ${error.message}`)
  }
}

// 运行测试
testBatchUpdate().catch(console.error)
