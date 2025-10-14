'use client'

import { useEffect, useState } from 'react'
import { getBeijingDateString } from '@/lib/date-utils'

export default function DebugCalendarPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDebugData()
  }, [])

  const loadDebugData = async () => {
    try {
      setLoading(true)

      // 获取学员AXCF2025040095的打卡记录
      const recordsResponse = await fetch('/api/checkin/records?student_id=AXCF2025040095&limit=30')
      const recordsData = await recordsResponse.json()

      // 获取学员的打卡安排
      const scheduleResponse = await fetch('/api/admin/checkin-schedule')
      const scheduleData = await scheduleResponse.json()
      const studentSchedule = scheduleData.data?.find((s: any) => s.student_id === 'AXCF2025040095')

      // 模拟管理员端的数据处理
      const checkinDates = new Set(recordsData.records?.map((r: any) => r.checkin_date) || [])

      // 生成10月份的日历数据
      const year = 2025
      const month = 9 // 10月 (0-indexed)
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      const calendarDays = []
      const currentDay = new Date(firstDay)

      while (currentDay <= lastDay) {
        const dateStr = getBeijingDateString(currentDay)
        const hasCheckin = checkinDates.has(dateStr)
        const isInSchedule = studentSchedule ?
          dateStr >= studentSchedule.start_date && dateStr <= studentSchedule.end_date : false
        const today = getBeijingDateString()
        const isPast = dateStr < today

        calendarDays.push({
          date: dateStr,
          day: currentDay.getDate(),
          hasCheckin,
          isInSchedule,
          isPast,
          today: dateStr === today
        })

        currentDay.setDate(currentDay.getDate() + 1)
      }

      setDebugData({
        records: recordsData.records,
        schedule: studentSchedule,
        checkinDates: Array.from(checkinDates),
        calendarDays,
        today: getBeijingDateString()
      })

    } catch (error) {
      console.error('调试数据加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">日历调试工具</h1>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 日历显示调试工具</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 原始数据 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">📊 原始数据</h2>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">打卡记录 ({debugData?.records?.length || 0})</h3>
              <div className="max-h-40 overflow-y-auto bg-gray-900 p-3 rounded text-xs">
                {debugData?.records?.map((record: any, index: number) => (
                  <div key={index} className="mb-1">
                    {record.checkin_date} - {record.xhs_url?.substring(0, 50)}...
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">打卡安排</h3>
              <div className="bg-gray-900 p-3 rounded text-xs">
                <p>开始日期: {debugData?.schedule?.start_date}</p>
                <p>结束日期: {debugData?.schedule?.end_date}</p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">打卡日期集合</h3>
              <div className="bg-gray-900 p-3 rounded text-xs">
                {debugData?.checkinDates?.join(', ')}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">今天日期</h3>
              <div className="bg-gray-900 p-3 rounded text-xs">
                {debugData?.today}
              </div>
            </div>
          </div>

          {/* 日历调试 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">📅 10月份日历调试</h2>

            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <div key={day} className="p-2 text-gray-400 font-medium">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {debugData?.calendarDays?.map((day: any, index: number) => (
                <div
                  key={index}
                  className={`p-2 rounded text-xs relative border ${
                    !day.isInSchedule
                      ? 'bg-gray-700 border-gray-600 text-gray-400'
                      : day.hasCheckin
                      ? 'bg-green-600 border-green-400 text-white'
                      : day.isPast
                      ? 'bg-red-600 border-red-400 text-white'
                      : day.today
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-gray-600 border-gray-400 text-white'
                  }`}
                >
                  <div>{day.day}</div>
                  <div className="text-xs mt-1">
                    {day.hasCheckin && '✅'}
                    {day.today && '📍'}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {day.date}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-600 rounded mr-2"></div>
                已打卡
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded mr-2"></div>
                忘记打卡
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-600 rounded mr-2"></div>
                未到时间
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                今天
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-700 rounded mr-2"></div>
                不在周期内
              </div>
            </div>
          </div>
        </div>

        {/* 问题分析 */}
        <div className="bg-gray-800 p-6 rounded-lg mt-6">
          <h2 className="text-xl font-bold mb-4">🔍 问题分析</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2 text-green-400">✅ 正确显示的日期</h3>
              <div className="bg-gray-900 p-3 rounded">
                {debugData?.calendarDays?.filter((day: any) => day.hasCheckin && day.isInSchedule).map((day: any) => (
                  <div key={day.date} className="text-green-400">
                    {day.date} (第{day.day}天) - ✅
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-red-400">❌ 可能错误的日期</h3>
              <div className="bg-gray-900 p-3 rounded">
                {debugData?.calendarDays?.filter((day: any) => day.hasCheckin && !day.isInSchedule).map((day: any) => (
                  <div key={day.date} className="text-red-400">
                    {day.date} (第{day.day}天) - 不在周期内
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-yellow-400">⚠️ 边界情况</h3>
              <div className="bg-gray-900 p-3 rounded">
                <p>今天: {debugData?.today}</p>
                <p>周期开始: {debugData?.schedule?.start_date}</p>
                <p>周期结束: {debugData?.schedule?.end_date}</p>
                <p>8-10日状态:
                  {debugData?.calendarDays?.filter((day: any) => [8, 9, 10].includes(day.day)).map((day: any) => (
                    <span key={day.date} className="ml-2">
                      {day.day}日: {day.hasCheckin ? '✅' : '❌'}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}