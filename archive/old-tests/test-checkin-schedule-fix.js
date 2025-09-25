const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://edoljoofbxinghqidgmr.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkb2xqb29mYnhpbmdocWlkZ21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMzcxNCwiZXhwIjoyMDcwNDg5NzE0fQ.aN3NjbYp-57tUsK7OXvNFpPevTPZ1eO9ci9oTcVjEQ4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCheckinScheduleAPI() {
  console.log('🧪 测试打卡日期设置API修复...')
  
  const baseUrl = 'http://localhost:3000' // 本地测试
  // const baseUrl = 'https://xiaohongshunavigator.netlify.app' // 生产环境测试
  
  // 测试用例
  const testCases = [
    {
      name: '测试1: 使用存在的学号',
      data: {
        mode: 'single',
        student_id: 'AXCF2025010003', // 已知存在的学号
        start_date: '2025-01-01',
        created_by: 'admin'
      },
      expectedSuccess: true
    },
    {
      name: '测试2: 使用不存在的学号',
      data: {
        mode: 'single',
        student_id: 'AXCF2025999999', // 不存在的学号
        start_date: '2025-01-01',
        created_by: 'admin'
      },
      expectedSuccess: false,
      expectedError: 'STUDENT_NOT_FOUND'
    },
    {
      name: '测试3: 批量设置（部分学号不存在）',
      data: {
        mode: 'batch',
        batch_start_id: 'AXCF2025010001',
        batch_end_id: 'AXCF2025010005',
        start_date: '2025-01-01',
        created_by: 'admin'
      },
      expectedSuccess: true // 这些学号应该都存在
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n🔍 ${testCase.name}`)
    
    try {
      const response = await fetch(`${baseUrl}/api/admin/checkin-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.data)
      })
      
      const result = await response.json()
      
      console.log(`   状态码: ${response.status}`)
      console.log(`   响应: ${JSON.stringify(result, null, 2)}`)
      
      if (testCase.expectedSuccess) {
        if (result.success) {
          console.log(`   ✅ 测试通过: 成功设置打卡日期`)
          
          // 清理测试数据
          if (testCase.data.mode === 'single') {
            await supabase
              .from('checkin_schedules')
              .delete()
              .eq('student_id', testCase.data.student_id)
              .eq('start_date', testCase.data.start_date)
            console.log(`   🗑️ 已清理测试数据`)
          }
        } else {
          console.log(`   ❌ 测试失败: 期望成功但实际失败`)
        }
      } else {
        if (!result.success && result.error === testCase.expectedError) {
          console.log(`   ✅ 测试通过: 正确识别并拒绝了无效学号`)
        } else {
          console.log(`   ❌ 测试失败: 期望错误 ${testCase.expectedError} 但得到 ${result.error}`)
        }
      }
      
    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`)
    }
  }
  
  console.log('\n📊 测试总结:')
  console.log('如果所有测试都通过，说明修复成功！')
  console.log('现在可以在管理员后台测试设置打卡日期功能。')
}

// 首先检查本地开发服务器是否运行
async function checkLocalServer() {
  try {
    const response = await fetch('http://localhost:3000/api/test-db')
    if (response.ok) {
      console.log('✅ 本地开发服务器正在运行')
      return true
    }
  } catch (error) {
    console.log('❌ 本地开发服务器未运行，请先启动: npm run dev')
    return false
  }
}

async function main() {
  const isLocalRunning = await checkLocalServer()
  
  if (isLocalRunning) {
    await testCheckinScheduleAPI()
  } else {
    console.log('\n💡 要测试修复效果，请：')
    console.log('1. 运行 npm run dev 启动本地服务器')
    console.log('2. 重新运行此测试脚本')
    console.log('3. 或者直接在管理员后台测试设置打卡日期功能')
  }
}

main().catch(console.error)
