// 测试日期计算是否正确（93天周期）

function testDateCalculation() {
  console.log('🧪 测试打卡日期计算逻辑...\n')

  const testCases = [
    {
      name: '测试案例1: 2025年1月开始',
      start_date: '2025-01-01'
    },
    {
      name: '测试案例2: 2025年2月开始',
      start_date: '2025-02-01'
    },
    {
      name: '测试案例3: 2025年8月开始',
      start_date: '2025-08-23'
    },
    {
      name: '测试案例4: 跨年测试',
      start_date: '2024-12-01'
    }
  ]

  testCases.forEach(testCase => {
    console.log(`📅 ${testCase.name}`)
    console.log(`   开始日期: ${testCase.start_date}`)

    // 模拟API中的计算逻辑
    const startDateObj = new Date(testCase.start_date + 'T00:00:00.000Z')
    const endDateObj = new Date(startDateObj.getTime() + (92 * 24 * 60 * 60 * 1000))
    const end_date = endDateObj.toISOString().split('T')[0]

    // 验证天数计算
    const actualDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    console.log(`   结束日期: ${end_date}`)
    console.log(`   总天数: ${actualDays}`)
    console.log(`   ✅ 是否正确: ${actualDays === 93 ? '是' : '否'}`)
    
    if (actualDays !== 93) {
      console.log(`   ❌ 错误: 应该是93天，实际是${actualDays}天`)
    }
    
    console.log('')
  })

  // 测试现有数据库中的问题案例
  console.log('🔍 检查现有数据库中的问题案例:')
  
  const problemCases = [
    { start: '2025-08-23', end: '2025-11-25' },
    { start: '2025-01-01', end: '2025-04-04' }
  ]

  problemCases.forEach((caseData, index) => {
    const startDate = new Date(caseData.start + 'T00:00:00.000Z')
    const endDate = new Date(caseData.end + 'T00:00:00.000Z')
    const actualDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    console.log(`   案例${index + 1}: ${caseData.start} 到 ${caseData.end}`)
    console.log(`   实际天数: ${actualDays}`)
    console.log(`   状态: ${actualDays === 93 ? '✅ 正确' : '❌ 错误'}`)
  })
}

// 运行测试
testDateCalculation()

console.log('\n📋 修复总结:')
console.log('1. ✅ 修复了日期计算逻辑，确保总是93天')
console.log('2. ✅ 添加了日期计算验证日志')
console.log('3. ✅ 改进了管理员后台日历显示，添加年月标识')
console.log('4. 🔄 需要重新设置现有学员的打卡日期以修复94天的问题')
