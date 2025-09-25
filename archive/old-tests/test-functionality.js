// 测试脚本 - 验证主要功能
const testFunctions = async () => {
  console.log('🧪 开始功能测试...')
  
  try {
    // 测试1: 检查服务器连接
    console.log('1. 测试服务器连接...')
    const response = await fetch('http://localhost:3000/api/test-connection')
    const result = await response.json()
    console.log('✅ 服务器连接正常:', result.message)
    
    // 测试2: 检查数据库连接
    console.log('2. 测试数据库连接...')
    if (result.database) {
      console.log('✅ 数据库连接正常')
    } else {
      console.log('❌ 数据库连接失败')
    }
    
    console.log('🎉 基础功能测试完成!')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 在浏览器控制台中运行
if (typeof window !== 'undefined') {
  window.testFunctionality = testFunctions
  console.log('💡 在浏览器控制台中运行: testFunctionality()')
} else {
  // Node.js环境
  testFunctions()
}