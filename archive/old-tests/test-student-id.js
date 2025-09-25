async function testStudentId() {
  try {
    console.log('🔍 测试学号 AXCF202501007...');
    
    // 测试用户信息API
    const userResponse = await fetch('http://localhost:3002/api/user?student_id=AXCF202501007');
    console.log('用户信息API状态:', userResponse.status);
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('用户信息:', userData);
    } else {
      console.log('用户信息API失败');
    }
    
    // 测试打卡安排API
    const scheduleResponse = await fetch('http://localhost:3002/api/admin/checkin-schedule?student_id=AXCF202501007');
    console.log('打卡安排API状态:', scheduleResponse.status);
    if (scheduleResponse.ok) {
      const scheduleData = await scheduleResponse.json();
      console.log('打卡安排:', JSON.stringify(scheduleData, null, 2));
    } else {
      console.log('打卡安排API失败');
    }
    
    // 测试打卡记录API
    const recordsResponse = await fetch('http://localhost:3002/api/checkin/records?student_id=AXCF202501007&limit=1000');
    console.log('打卡记录API状态:', recordsResponse.status);
    if (recordsResponse.ok) {
      const recordsData = await recordsResponse.json();
      console.log('打卡记录:', JSON.stringify(recordsData, null, 2));
    } else {
      console.log('打卡记录API失败');
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testStudentId();
