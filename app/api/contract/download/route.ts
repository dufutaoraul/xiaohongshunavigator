import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

// 计算93天后的日期
function calculateEndDate(startDate: string): string {
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(start.getDate() + 92) // 93天包含开始日期，所以加92天
  return end.toISOString().split('T')[0]
}

// 格式化日期为中文格式
function formatDateToChinese(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}年${month}月${day}日`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const startDate = searchParams.get('start_date')

    if (!studentId || !startDate) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 计算结束日期
    const endDate = calculateEndDate(startDate)
    const startDateChinese = formatDateToChinese(startDate)
    const endDateChinese = formatDateToChinese(endDate)

    // 创建一个简单的PDF合同（不依赖模板文件）
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()

    // 使用内置字体（避免中文编码问题）
    // 将中文转换为拼音或英文描述
    const contractText = [
      'XIAOHONGSHU CHECKIN CONTRACT',
      '=================================',
      '',
      `Student ID: ${studentId}`,
      `Start Date: ${startDate} (${startDateChinese})`,
      `End Date: ${endDate} (${endDateChinese})`,
      `Duration: 93 days total`,
      `Target: Complete 90 days to pass`,
      '',
      `Generated: ${new Date().toLocaleString('en-US')}`,
      '',
      'Terms:',
      '1. Student must submit valid Xiaohongshu links',
      '2. Complete 90 out of 93 days to graduate',
      '3. All submissions subject to review',
      '',
      'Contact: AI Learning Community'
    ]

    // 添加文本到PDF
    let yPosition = height - 50
    const lineHeight = 20

    for (const line of contractText) {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: line.includes('=') ? 14 : (line.startsWith('XIAOHONGSHU') ? 16 : 12),
        color: rgb(0, 0, 0),
      })
      yPosition -= lineHeight
    }

    // 添加边框
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    })

    // 生成PDF
    const pdfBytes = await pdfDoc.save()

    // 返回PDF文件
    return new Response(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="checkin-contract-${studentId}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('生成PDF合同失败:', error)
    return NextResponse.json({ 
      error: '生成PDF合同失败', 
      details: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 })
  }
}
