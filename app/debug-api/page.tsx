'use client'

import { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Textarea from '../components/Textarea'

export default function DebugApiPage() {
  const [studentId, setStudentId] = useState('AXCF2025040001')
  const [userInput, setUserInput] = useState('今天我学会了用Gemini生成网页，效率提升了很多')
  const [angle, setAngle] = useState('效率提升')
  const [dayNumber, setDayNumber] = useState('1')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultType, setResultType] = useState<'info' | 'success' | 'error' | 'loading'>('info')

  const angles = [
    { value: '踩坑经验', label: '踩坑经验' },
    { value: '效率提升', label: '效率提升' },
    { value: '新手建议', label: '新手建议' },
    { value: '案例分析', label: '案例分析' },
    { value: '工具推荐', label: '工具推荐' }
  ]

  const showResult = (message: string, type: 'info' | 'success' | 'error' | 'loading') => {
    setResult(message)
    setResultType(type)
  }

  const handleTest = async () => {
    if (!studentId || !userInput || !angle || !dayNumber) {
      showResult('请填写所有必填项', 'error')
      return
    }

    setLoading(true)
    
    const requestData = {
      student_id: studentId,
      user_input: userInput,
      angle: angle,
      day_number: parseInt(dayNumber)
    }
    
    showResult(`开始测试 API 调用...\n请求数据:\n${JSON.stringify(requestData, null, 2)}`, 'loading')

    try {
      const startTime = Date.now()
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log('Response status:', response.status)
      console.log('Response headers:', [...response.headers.entries()])
      
      if (!response.ok) {
        let errorMsg = `HTTP ${response.status} - ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMsg += '\n错误详情: ' + JSON.stringify(errorData, null, 2)
        } catch (e) {
          errorMsg += '\n无法解析错误响应'
        }
        throw new Error(errorMsg)
      }
      
      const apiResult = await response.json()
      
      const successMsg = `✅ API 调用成功! (耗时: ${duration}ms)\n\n` +
        `响应数据结构:\n` +
        `- titles: ${apiResult.titles?.length || 0} 个\n` +
        `- bodies: ${apiResult.bodies?.length || 0} 个\n` +
        `- hashtags: ${Array.isArray(apiResult.hashtags) ? apiResult.hashtags.length : '非数组格式'} 个\n` +
        `- images: ${apiResult.visuals?.images?.length || 0} 个\n` +
        `- videos: ${apiResult.visuals?.videos?.length || 0} 个\n` +
        `- 数据源: ${apiResult.dify ? 'Dify AI' : '模拟数据'}\n` +
        `- 来源标识: ${apiResult.source || '未知'}\n\n` +
        `完整响应:\n` + JSON.stringify(apiResult, null, 2)
      
      showResult(successMsg, 'success')
      
    } catch (error) {
      const errorMsg = `❌ API 调用失败:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n堆栈追踪:\n${error instanceof Error ? error.stack || '无堆栈信息' : '无堆栈信息'}`
      showResult(errorMsg, 'error')
      console.error('API Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center fade-in-up">
        <h1 className="text-4xl font-bold gradient-text mb-6">🔧 Dify API 调试工具</h1>
        <p className="text-xl text-white/80">
          用于快速测试和诊断 Dify API 集成问题
        </p>
      </div>

      <Card title="API 测试参数" icon="🚀" className="mb-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              学员学号 <span className="text-pink-400 ml-1">*</span>
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300"
              placeholder="例如: AXCF2025040001"
            />
          </div>

          <Textarea
            label="学习主题/灵感"
            placeholder="描述你想要分享的内容主题"
            value={userInput}
            onChange={setUserInput}
            required
            rows={3}
          />

          <div>
            <label className="block text-sm font-semibold text-white mb-4">
              分享角度 <span className="text-pink-400 ml-1">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {angles.map((angleOption) => (
                <button
                  key={angleOption.value}
                  onClick={() => setAngle(angleOption.value)}
                  className={`px-4 py-3 rounded-lg border text-center transition-all duration-300 ${
                    angle === angleOption.value
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-purple-500 shadow-lg shadow-purple-500/25 transform scale-105'
                      : 'glass-effect text-white border-white/30 hover:border-purple-400 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/10'
                  }`}
                >
                  {angleOption.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              第几天打卡 <span className="text-pink-400 ml-1">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={dayNumber}
              onChange={(e) => setDayNumber(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300"
            />
          </div>

          <Button onClick={handleTest} disabled={loading} className="w-full">
            {loading ? '⏳ 正在测试...' : '🚀 测试 API 调用'}
          </Button>
        </div>
      </Card>

      {result && (
        <Card title="测试结果" icon="📊">
          <div className={`glass-effect p-6 rounded-lg border-l-4 ${
            resultType === 'success' ? 'border-green-400 text-green-200' :
            resultType === 'error' ? 'border-red-400 text-red-200' :
            resultType === 'loading' ? 'border-yellow-400 text-yellow-200' :
            'border-blue-400 text-blue-200'
          }`}>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed overflow-x-auto">
              {result}
            </pre>
          </div>
        </Card>
      )}
    </div>
  )
}