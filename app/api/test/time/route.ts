import { NextRequest, NextResponse } from 'next/server'
import { getBeijingDateString, getBeijingDate } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    
    // 方法1：当前的计算方式
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
    const beijingTime1 = new Date(utcTime + (8 * 3600000))
    
    // 方法2：使用toLocaleString
    const beijingTime2 = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Shanghai"}))
    
    // 方法3：直接使用Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const beijingDateStr3 = formatter.format(now).replace(/\//g, '-')
    
    // 使用我们的工具函数
    const beijingDateStr = getBeijingDateString()
    const beijingDateObj = getBeijingDate()
    
    return NextResponse.json({
      success: true,
      data: {
        系统本地时间: {
          iso: now.toISOString(),
          local: now.toString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timezoneOffset: now.getTimezoneOffset()
        },
        北京时间计算方法1: {
          iso: beijingTime1.toISOString(),
          dateString: beijingTime1.toISOString().split('T')[0],
          local: beijingTime1.toString()
        },
        北京时间计算方法2: {
          iso: beijingTime2.toISOString(),
          dateString: beijingTime2.toISOString().split('T')[0],
          local: beijingTime2.toString()
        },
        北京时间计算方法3: {
          dateString: beijingDateStr3
        },
        工具函数结果: {
          getBeijingDateString: beijingDateStr,
          getBeijingDate: beijingDateObj.toISOString(),
          getBeijingDateLocal: beijingDateObj.toString()
        }
      }
    })

  } catch (error) {
    console.error('❌ [Time Test] 测试失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
