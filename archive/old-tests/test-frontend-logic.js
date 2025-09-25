// 测试前端页面的学员状态计算逻辑

async function testFrontendLogic() {
  console.log('🧪 测试前端学员状态计算逻辑...\n')

  try {
    // 1. 获取所有打卡安排
    const scheduleResponse = await fetch('http://localhost:3001/api/admin/checkin-schedule')
    const scheduleData = await scheduleResponse.json()
    const schedules = scheduleData.data || []

    // 2. 获取所有打卡记录
    const recordsResponse = await fetch('http://localhost:3001/api/checkin/records?limit=1000')
    const recordsData = await recordsResponse.json()
    const allRecords = recordsData.records || []

    // 3. 获取所有学员
    const studentsResponse = await fetch('http://localhost:3001/api/admin/students')
    const studentsData = await studentsResponse.json()
    const allStudents = studentsData.students || []

    console.log('📊 数据统计:')
    console.log(`   打卡安排: ${schedules.length} 个`)
    console.log(`   打卡记录: ${allRecords.length} 条`)
    console.log(`   学员总数: ${allStudents.length} 人`)

    // 4. 模拟前端页面的计算逻辑
    const today = '2025-09-03'
    const todayDate = new Date(today + 'T00:00:00')

    const studentStats = allStudents.map((student) => {
      // 找到该学员的打卡安排
      const studentSchedule = schedules.find((s) => {
        return s.student_id === student.student_id
      })

      if (!studentSchedule) {
        return {
          ...student,
          status: 'no_schedule',
          checkinDays: 0,
          totalDays: 0
        }
      }

      const startDate = new Date(studentSchedule.start_date + 'T00:00:00')
      const endDate = new Date(studentSchedule.end_date + 'T23:59:59')

      // 只计算在打卡周期内的记录
      const studentRecords = allRecords.filter((r) =>
        r.student_id === student.student_id &&
        r.checkin_date >= studentSchedule.start_date &&
        r.checkin_date <= studentSchedule.end_date
      )

      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const checkinDays = studentRecords.length

      let status = 'active' // 默认为正在打卡

      if (todayDate > endDate) {
        // 打卡期已结束，根据93天内完成90次打卡的标准判断
        const actualPeriodDays = Math.min(93, totalDays)
        const isQualified = checkinDays >= 90 && actualPeriodDays >= 90
        status = isQualified ? 'qualified' : 'unqualified'
      } else if (todayDate < startDate) {
        // 打卡期还未开始
        status = 'not_started'
      } else {
        // 打卡期进行中 - 正在打卡
        status = 'active'
      }

      return {
        ...student,
        status,
        checkinDays,
        totalDays,
        schedule: studentSchedule,
        records: studentRecords
      }
    })

    // 5. 统计各状态的学员数量
    const statusCounts = {
      active: studentStats.filter(s => s.status === 'active').length,
      qualified: studentStats.filter(s => s.status === 'qualified').length,
      unqualified: studentStats.filter(s => s.status === 'unqualified').length,
      not_started: studentStats.filter(s => s.status === 'not_started').length,
      no_schedule: studentStats.filter(s => s.status === 'no_schedule').length
    }

    console.log('\n📈 前端计算结果:')
    console.log(`   正在打卡: ${statusCounts.active} 人`)
    console.log(`   打卡合格: ${statusCounts.qualified} 人`)
    console.log(`   打卡不合格: ${statusCounts.unqualified} 人`)
    console.log(`   未开始: ${statusCounts.not_started} 人`)
    console.log(`   无安排: ${statusCounts.no_schedule} 人`)

    // 6. 显示不合格学员详情
    const unqualifiedStudents = studentStats.filter(s => s.status === 'unqualified')
    console.log('\n❌ 打卡不合格学员详情:')
    unqualifiedStudents.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.student_id} (${student.name})`)
      console.log(`      周期: ${student.schedule.start_date} ~ ${student.schedule.end_date}`)
      console.log(`      打卡: ${student.checkinDays}天 / 需要90天`)
      console.log(`      总天数: ${student.totalDays}天`)
    })

    // 7. 对比API统计结果
    const apiResponse = await fetch('http://localhost:3001/api/admin/checkin-stats')
    const apiData = await apiResponse.json()
    
    console.log('\n🔄 API vs 前端对比:')
    console.log(`   API不合格: ${apiData.forgotStudents} 人`)
    console.log(`   前端不合格: ${statusCounts.unqualified} 人`)
    console.log(`   差异: ${Math.abs(apiData.forgotStudents - statusCounts.unqualified)} 人`)

    if (apiData.forgotStudents !== statusCounts.unqualified) {
      console.log('\n⚠️  发现不一致！需要进一步调试API逻辑')
    } else {
      console.log('\n✅ API和前端计算结果一致！')
    }

  } catch (error) {
    console.log('\n❌ 测试失败:')
    console.log(`   错误: ${error.message}`)
  }
}

// 运行测试
testFrontendLogic().catch(console.error)
