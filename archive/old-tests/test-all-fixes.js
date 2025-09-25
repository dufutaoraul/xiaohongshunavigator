// 测试所有修复的功能

async function testAllFixes() {
  console.log('🧪 测试所有修复的功能...\n')

  const baseUrl = 'http://localhost:3001'

  try {
    // 1. 测试打卡详情页面是否存在
    console.log('1️⃣ 测试打卡详情页面...')
    const detailsResponse = await fetch(`${baseUrl}/checkin-details?student_id=AXCF2025010005`)
    console.log(`   状态码: ${detailsResponse.status}`)
    if (detailsResponse.status === 200) {
      console.log('   ✅ 打卡详情页面可以访问')
    } else {
      console.log('   ❌ 打卡详情页面访问失败')
    }

    // 2. 测试小红书链接绑定API
    console.log('\n2️⃣ 测试小红书链接绑定API...')
    const profileUpdateResponse = await fetch(`${baseUrl}/api/user`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'AXCF2025010007',
        xiaohongshu_profile_url: 'https://www.xiaohongshu.com/user/profile/test123'
      })
    })
    const profileResult = await profileUpdateResponse.json()
    console.log(`   状态码: ${profileUpdateResponse.status}`)
    console.log(`   响应: ${JSON.stringify(profileResult, null, 2)}`)
    if (profileResult.success) {
      console.log('   ✅ 小红书链接绑定API正常')
    } else {
      console.log('   ❌ 小红书链接绑定API失败')
    }

    // 3. 测试打卡提交API
    console.log('\n3️⃣ 测试打卡提交API...')
    const checkinResponse = await fetch(`${baseUrl}/api/checkin/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'AXCF2025010007',
        urls: ['https://www.xiaohongshu.com/explore/test123456'],
        date: '2025-09-03'
      })
    })
    const checkinResult = await checkinResponse.json()
    console.log(`   状态码: ${checkinResponse.status}`)
    console.log(`   响应: ${JSON.stringify(checkinResult, null, 2)}`)
    if (checkinResult.success) {
      console.log('   ✅ 打卡提交API正常')
    } else {
      console.log('   ❌ 打卡提交API失败')
    }

    // 4. 测试统计API一致性
    console.log('\n4️⃣ 测试统计API一致性...')
    const statsResponse = await fetch(`${baseUrl}/api/admin/checkin-stats`)
    const statsResult = await statsResponse.json()
    console.log(`   状态码: ${statsResponse.status}`)
    if (statsResult.success) {
      console.log(`   正在打卡: ${statsResult.activePunches} 人`)
      console.log(`   打卡合格: ${statsResult.qualifiedStudents} 人`)
      console.log(`   未开始: ${statsResult.notStartedStudents} 人`)
      console.log(`   打卡不合格: ${statsResult.forgotStudents} 人`)
      console.log('   ✅ 统计API正常')
    } else {
      console.log('   ❌ 统计API失败')
    }

    // 5. 测试用户信息获取API
    console.log('\n5️⃣ 测试用户信息获取API...')
    const userResponse = await fetch(`${baseUrl}/api/user?student_id=AXCF2025010007`)
    const userResult = await userResponse.json()
    console.log(`   状态码: ${userResponse.status}`)
    if (userResponse.status === 200 && userResult) {
      console.log(`   学员姓名: ${userResult.name}`)
      console.log(`   小红书链接: ${userResult.xiaohongshu_profile_url || '未绑定'}`)
      console.log('   ✅ 用户信息API正常')
    } else {
      console.log('   ❌ 用户信息API失败')
    }

    console.log('\n🎉 所有功能测试完成！')

  } catch (error) {
    console.log('\n❌ 测试过程中发生错误:')
    console.log(`   错误: ${error.message}`)
  }
}

// 运行测试
testAllFixes().catch(console.error)
