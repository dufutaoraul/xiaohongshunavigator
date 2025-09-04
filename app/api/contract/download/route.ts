import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
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

    // 读取PDF模板文件
    const templatePath = path.join(process.cwd(), 'public', '7.7夏令营——爱学AI社区相关文档.pdf')
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'PDF模板文件不存在' }, { status: 404 })
    }

    const templateBytes = fs.readFileSync(templatePath)
    const pdfDoc = await PDFDocument.load(templateBytes)

    // 获取第一页
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    // 嵌入字体（支持中文）
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // 在PDF上添加打卡时间信息
    const contractText = `
打卡时间：
${startDateChinese}至${endDateChinese}，共计93天。
需完成90天打卡方可合格。

学员编号：${studentId}
生成时间：${new Date().toLocaleString('zh-CN')}
    `.trim()

    // 在页面底部添加合同信息
    firstPage.drawText(contractText, {
      x: 50,
      y: 100,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
      lineHeight: 18,
    })

    // 生成新的PDF
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
