'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import StudentInput from '../components/StudentInput'

interface PunchRecord {
  id: string
  submitted_at: string
  post_url: string
  post_created_at: string
  likes: number
  comments: number
  collections: number
}

export default function DashboardPage() {
  const [studentId, setStudentId] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [punchRecords, setPunchRecords] = useState<PunchRecord[]>([])
  const [stats, setStats] = useState({
    totalDays: 0,
    thisMonthDays: 0,
    punchRate: 0
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmitPunch = async () => {
    if (!studentId.trim() || !postUrl.trim()) {
      setMessage('请填写所有必填项')
      return
    }

    if (!postUrl.includes('xiaohongshu.com') && !postUrl.includes('xhs.com')) {
      setMessage('请输入有效的小红书链接')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/punch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          post_url: postUrl
        }),
      })

      if (response.ok) {
        setMessage('打卡成功！')
        setPostUrl('')
        loadPunchHistory()
      } else {
        const error = await response.json()
        setMessage(error.message || '打卡失败，请稍后重试')
      }
    } catch (error) {
      setMessage('网络错误，请检查连接')
      console.error('Punch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPunchHistory = useCallback(async () => {
    if (!studentId.trim()) return

    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const response = await fetch(`/api/punch-history?student_id=${encodeURIComponent(studentId)}&month=${currentMonth}`)
      
      if (response.ok) {
        const data = await response.json()
        setPunchRecords(data.records || [])
        setStats(data.stats || { totalDays: 0, thisMonthDays: 0, punchRate: 0 })
      }
    } catch (error) {
      console.error('Load history error:', error)
    }
  }, [studentId])

  useEffect(() => {
    if (studentId.trim()) {
      loadPunchHistory()
    }
  }, [studentId, loadPunchHistory])

  const generateCalendar = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    
    const punchDays = punchRecords.map(record => 
      new Date(record.post_created_at).getDate()
    )

    const calendar = []
    
    // 空白天数
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendar.push(<div key={`empty-${i}`} className="p-2"></div>)
    }
    
    // 日历天数
    for (let day = 1; day <= daysInMonth; day++) {
      const isPunched = punchDays.includes(day)
      const isToday = day === now.getDate()
      
      calendar.push(
        <div
          key={day}
          className={`p-2 text-center text-sm rounded ${
            isPunched 
              ? 'bg-green-500 text-white font-bold' 
              : 'bg-gray-100 text-gray-700'
          } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
        >
          {day}
        </div>
      )
    }
    
    return calendar
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center fade-in-up">
        <h1 className="text-4xl font-bold gradient-text mb-6">📊 自动化打卡与进度中心</h1>
        <p className="text-xl text-white/80">
          提交你的小红书帖子链接，追踪创作进度和数据表现 📈
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card title="提交打卡" icon="📝">
            <div className="space-y-4">
              <StudentInput
                value={studentId}
                onChange={setStudentId}
                required
              />
              
              <Input
                label="小红书帖子链接"
                placeholder="粘贴小红书帖子URL，如：https://www.xiaohongshu.com/explore/..."
                value={postUrl}
                onChange={setPostUrl}
                type="url"
                required
              />
              
              <Button onClick={handleSubmitPunch} disabled={loading} className="w-full">
                {loading ? '提交中...' : '提交打卡'}
              </Button>

              {message && (
                <div className={`p-4 rounded-lg glass-effect border-l-4 ${
                  message.includes('成功') 
                    ? 'border-green-400 text-green-200' 
                    : 'border-red-400 text-red-200'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </Card>

          <Card title="打卡日历" icon="📅">
            <div className="mb-6 text-center">
              <h3 className="text-lg font-semibold text-white">
                {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
              </h3>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-3">
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-white/70">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {generateCalendar()}
            </div>
            <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span className="text-white/80">已打卡</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-white/20 border-2 border-white/40 rounded mr-2"></div>
                <span className="text-white/80">未打卡</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="打卡统计" icon="📈">
            <div className="space-y-4">
              <div className="text-center p-4 glass-effect rounded-lg border border-white/20">
                <div className="text-3xl font-bold gradient-text">{stats.thisMonthDays}</div>
                <div className="text-sm text-white/70">本月打卡天数</div>
              </div>
              
              <div className="text-center p-4 glass-effect rounded-lg border border-white/20">
                <div className="text-3xl font-bold gradient-text">{stats.totalDays}</div>
                <div className="text-sm text-white/70">累计打卡天数</div>
              </div>
              
              <div className="text-center p-4 glass-effect rounded-lg border border-white/20">
                <div className="text-3xl font-bold gradient-text">{stats.punchRate}%</div>
                <div className="text-sm text-white/70">本月打卡率</div>
              </div>
            </div>
          </Card>

          <Card title="最近打卡记录" icon="🗓️">
            <div className="space-y-3">
              {punchRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="p-3 glass-effect rounded-lg border border-white/10">
                  <div className="text-sm font-medium text-white">
                    {new Date(record.post_created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-white/70 mt-1">
                    👍 {record.likes} 💬 {record.comments} ⭐ {record.collections}
                  </div>
                </div>
              ))}
              {punchRecords.length === 0 && (
                <div className="text-center text-white/60 py-6">
                  🌟 暂无打卡记录，开始你的创作之旅吧！
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}