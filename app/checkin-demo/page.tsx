'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckinDemoPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState('')
  const [checkinRecords, setCheckinRecords] = useState<any[]>([])
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [todayUrl, setTodayUrl] = useState('')

  useEffect(() => {
    setCurrentDate(new Date().toISOString().split('T')[0])
    // 生成一些演示数据
    generateDemoData()
  }, [])

  const generateDemoData = () => {
    const today = new Date()
    const records = []
    
    // 生成过去30天的演示打卡记录
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      // 随机生成打卡状态
      const hasCheckin = Math.random() > 0.3 // 70%概率有打卡
      const isValid = hasCheckin && Math.random() > 0.1 // 90%概率有效
      
      if (hasCheckin) {
        records.push({
          id: `demo_${i}`,
          checkin_date: dateStr,
          xhs_url: `https://www.xiaohongshu.com/explore/demo_${i}`,
          status: isValid ? 'valid' : 'invalid',
          post_publish_time: date.toISOString()
        })
      }
    }
    
    setCheckinRecords(records)
  }

  // 生成日历天数
  const generateCalendarDays = () => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 29) // 显示过去30天
    
    const days = []
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      
      const record = checkinRecords.find(r => r.checkin_date === dateStr)
      const isToday = dateStr === currentDate
      
      days.push({
        date: dateStr,
        day: date.getDate(),
        record,
        isToday
      })
    }
    
    return days
  }

  const handleSubmitCheckin = () => {
    if (!todayUrl.trim()) {
      alert('请输入小红书链接')
      return
    }
    
    // 模拟提交成功
    const newRecord = {
      id: `demo_today`,
      checkin_date: currentDate,
      xhs_url: todayUrl,
      status: 'valid',
      post_publish_time: new Date().toISOString()
    }
    
    setCheckinRecords(prev => [...prev.filter(r => r.checkin_date !== currentDate), newRecord])
    setTodayUrl('')
    setShowSubmitModal(false)
    alert('演示打卡提交成功！')
  }

  const calendarDays = generateCalendarDays()
  const validCheckins = checkinRecords.filter(r => r.status === 'valid').length
  const totalCheckins = checkinRecords.length
  const completionRate = totalCheckins > 0 ? Math.round((validCheckins / 90) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* 头部导航 */}
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-300"
        >
          ← 返回首页
        </button>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">📊</div>
            <h1 className="text-4xl font-bold text-white mb-4">
              打卡中心 <span className="text-yellow-400">(演示版)</span>
            </h1>
            <p className="text-white/80 text-lg">
              90天打卡挑战 - 坚持就是胜利！
            </p>
          </div>

          {/* 打卡进度概览 */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{validCheckins}</div>
              <div className="text-white/80">有效打卡</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{totalCheckins}</div>
              <div className="text-white/80">总打卡数</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{completionRate}%</div>
              <div className="text-white/80">完成进度</div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">挑战进度</h3>
              <span className="text-white/80">{validCheckins}/90 天</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((validCheckins / 90) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* 打卡日历 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-8">
            <h3 className="text-white font-semibold mb-4">打卡日历 (最近30天)</h3>
            <div className="grid grid-cols-10 gap-2">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                    ${day.isToday 
                      ? 'bg-yellow-500 text-black' 
                      : day.record
                        ? day.record.status === 'valid'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-gray-600 text-gray-300'
                    }
                  `}
                  title={`${day.date} ${day.record ? (day.record.status === 'valid' ? '✅ 有效打卡' : '❌ 无效打卡') : '未打卡'}`}
                >
                  {day.day}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-white/80">有效打卡</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-white/80">无效打卡</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-600 rounded"></div>
                <span className="text-white/80">未打卡</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-white/80">今天</span>
              </div>
            </div>
          </div>

          {/* 今日打卡 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-8">
            <h3 className="text-white font-semibold mb-4">今日打卡</h3>
            {checkinRecords.find(r => r.checkin_date === currentDate) ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h4 className="text-xl font-bold text-green-400 mb-2">今日已打卡</h4>
                <p className="text-white/80">继续保持，加油！</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📝</div>
                <h4 className="text-xl font-bold text-white mb-4">今日尚未打卡</h4>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  提交今日打卡
                </button>
              </div>
            )}
          </div>

          {/* 演示说明 */}
          <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🎭</div>
            <h3 className="text-yellow-400 font-bold text-lg mb-2">这是演示页面</h3>
            <p className="text-white/80 mb-4">
              这里展示的是打卡页面的完整设计和功能。所有数据都是模拟的，用于展示页面效果。
            </p>
            <p className="text-white/60 text-sm">
              实际使用时，数据会从数据库中获取，并且需要用户登录和绑定小红书主页。
            </p>
          </div>
        </div>
      </div>

      {/* 提交打卡模态框 */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-md mx-4 w-full">
            <h3 className="text-white font-bold text-lg mb-4">提交今日打卡</h3>
            <p className="text-white/80 text-sm mb-4">
              请输入您今天发布的小红书链接：
            </p>
            <input
              type="url"
              value={todayUrl}
              onChange={(e) => setTodayUrl(e.target.value)}
              placeholder="https://www.xiaohongshu.com/explore/..."
              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleSubmitCheckin}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
              >
                提交打卡
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
