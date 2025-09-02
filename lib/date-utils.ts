/**
 * 时间工具函数 - 统一处理北京时间
 */

/**
 * 获取北京时间的日期字符串（YYYY-MM-DD格式）
 */
export function getBeijingDateString(date?: Date): string {
  const now = date || new Date()

  // 使用更可靠的方法获取北京时间
  const beijingTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Shanghai"}))

  // 格式化为 YYYY-MM-DD
  const year = beijingTime.getFullYear()
  const month = String(beijingTime.getMonth() + 1).padStart(2, '0')
  const day = String(beijingTime.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 获取北京时间的Date对象
 */
export function getBeijingDate(date?: Date): Date {
  const now = date || new Date()

  // 使用更可靠的方法获取北京时间
  return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Shanghai"}))
}

/**
 * 比较两个日期字符串（YYYY-MM-DD格式）
 */
export function compareDateStrings(date1: string, date2: string): number {
  if (date1 < date2) return -1
  if (date1 > date2) return 1
  return 0
}

/**
 * 获取北京时间的今天、昨天、明天日期字符串
 */
export function getBeijingDateStrings() {
  const today = getBeijingDateString()
  const yesterday = getBeijingDateString(new Date(Date.now() - 24 * 60 * 60 * 1000))
  const tomorrow = getBeijingDateString(new Date(Date.now() + 24 * 60 * 60 * 1000))
  
  return { today, yesterday, tomorrow }
}

/**
 * 检查日期字符串是否是今天（北京时间）
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getBeijingDateString()
}

/**
 * 检查日期字符串是否在过去（北京时间）
 */
export function isPastDate(dateStr: string): boolean {
  return dateStr < getBeijingDateString()
}

/**
 * 检查日期字符串是否在未来（北京时间）
 */
export function isFutureDate(dateStr: string): boolean {
  return dateStr > getBeijingDateString()
}