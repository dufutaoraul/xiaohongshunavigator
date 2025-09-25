// 调试打卡数据，查看所有学员的打卡状态

async function debugCheckinData() {
  console.log('🔍 调试打卡数据...\n')

  try {
    // 1. 获取所有打卡安排
    const scheduleResponse = await fetch('http://localhost:3001/api/admin/checkin-schedule')
    const scheduleData = await scheduleResponse.json()

    console.log('📅 所有打卡安排:')
    console.log('API返回数据结构:', JSON.stringify(scheduleData, null, 2))

    const schedules = scheduleData.schedules || scheduleData.data || []
    if (schedules && schedules.length > 0) {
      schedules.forEach((schedule, index) => {
        console.log(`   ${index + 1}. 学号: ${schedule.student_id}`)
        console.log(`      开始: ${schedule.start_date}`)
        console.log(`      结束: ${schedule.end_date}`)
        console.log(`      活跃: ${schedule.is_active}`)
        console.log('')
      })
    } else {
      console.log('   没有找到打卡安排数据')
    }

    // 2. 获取所有打卡记录
    const recordsResponse = await fetch('http://localhost:3001/api/checkin/records?limit=1000')
    const recordsData = await recordsResponse.json()
    
    console.log('📊 打卡记录统计:')
    if (recordsData.records) {
      const recordsByStudent = {}
      recordsData.records.forEach(record => {
        if (!recordsByStudent[record.student_id]) {
          recordsByStudent[record.student_id] = []
        }
        recordsByStudent[record.student_id].push(record.checkin_date)
      })
      
      Object.keys(recordsByStudent).forEach(studentId => {
        console.log(`   ${studentId}: ${recordsByStudent[studentId].length} 次打卡`)
      })
    }

    // 3. 计算每个学员的状态
    console.log('\n🧮 学员状态计算:')
    const today = '2025-09-03' // 当前日期

    if (schedules && schedules.length > 0) {
      schedules.forEach(schedule => {
        const startDate = new Date(schedule.start_date)
        const endDate = new Date(schedule.end_date)
        const todayDate = new Date(today)
        
        // 获取该学员的打卡记录
        const studentRecords = recordsData.records ? 
          recordsData.records.filter(r => 
            r.student_id === schedule.student_id &&
            r.checkin_date >= schedule.start_date &&
            r.checkin_date <= schedule.end_date
          ) : []
        
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        const checkinDays = studentRecords.length
        const actualPeriodDays = Math.min(93, totalDays)
        
        let status = 'unknown'
        if (todayDate > endDate) {
          // 打卡期已结束
          const isQualified = checkinDays >= 90 && actualPeriodDays >= 90
          status = isQualified ? 'qualified' : 'unqualified'
        } else if (todayDate < startDate) {
          status = 'not_started'
        } else {
          status = 'active'
        }
        
        console.log(`   ${schedule.student_id}:`)
        console.log(`      状态: ${status}`)
        console.log(`      周期: ${schedule.start_date} ~ ${schedule.end_date} (${totalDays}天)`)
        console.log(`      打卡: ${checkinDays}天`)
        console.log(`      是否结束: ${todayDate > endDate ? '是' : '否'}`)
        if (status === 'unqualified') {
          console.log(`      ❌ 不合格原因: 需要90天，实际${checkinDays}天`)
        }
        console.log('')
      })
    }

  } catch (error) {
    console.log('\n❌ 调试失败:')
    console.log(`   错误: ${error.message}`)
  }
}

// 运行调试
debugCheckinData().catch(console.error)
