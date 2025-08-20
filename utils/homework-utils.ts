import { Assignment } from '@/types/homework';

// 作业天数显示映射工具
export const assignmentDayMapping: Record<string, string> = {
  "03a959e7-48ba-4b6a-bcb9-8957bcaa18fe": "第二周第六天",
  "a853efbf-fe9e-41d2-9a4c-3d24850cd205": "第二周第六天",
  "d389d72a-34aa-405b-87c1-2ebfcf9cd66f": "第一周第一天",
  "ee995805-c5ef-4e88-9877-5cbfca5afd16": "第一周第一天",
  "c4470efe-8e47-44fa-9e93-a8ffd843b471": "第一周第一天",
  "1e601bc4-5d5f-4e08-b79c-b2d4adf507e6": "第一周第一天",
  "6f5db208-a4b6-4872-970b-e32a3ea6a971": "第一周第二天上午",
  "ecd889aa-8c70-44e0-9845-bfece36607ea": "第一周第二天上午",
  "4d594f12-eb0e-4f0b-84d3-3dd9862289b5": "第一周第二天下午",
  "187e771f-b7bd-46e9-a6fe-55811a3ea817": "第一周第二天下午",
  "1d0f4020-e65b-4242-9ac8-186797f89c39": "第一周第二天下午",
  "df10b702-40b5-49dc-acde-def601420665": "第一周第二天下午",
  "032f1a69-1d86-4fa7-b861-990a62d46119": "第一周第三天",
  "0ae10a87-f31e-41b1-ba40-1ca3a29643ae": "第一周第三天",
  "f20df2b1-3c6f-4588-953e-305f8f2f6e1e": "第一周第三天",
  "0ce398ab-cffd-4d7f-8030-098885e11ada": "第一周第四天",
  "355fb251-e389-4472-b3e1-a44e9183eb8c": "第一周第四天",
  "584a1f2f-79ef-45ed-b5e3-eed6727ad93d": "第一周第五天上午",
  "09cf0e55-edee-4918-a7ee-c0ca80634798": "第一周第五天上午",
  "e8d8d55e-53b3-4553-a47e-285cb8fca8da": "第一周第五天上午",
  "01905238-0d9f-44af-a9e7-7a1a436d9ae2": "第一周第五天下午",
  "b80930ca-79e1-4060-b7e1-db68e02a26a2": "第一周第五天下午",
  "65ad4933-8887-4ece-a8b6-d821ba513b52": "第一周第五天下午",
  "ff4c7a7c-42dc-480c-9ae8-28070d0c7bff": "第一周第六天",
  "93617ee2-5ee5-4223-903d-344342d7e864": "第一周第七天上午",
  "ee239a59-996e-4f7b-a9bc-e29939771158": "第一周第七天下午",
  "24258968-2872-4840-a74e-0227b533712c": "第一周第七天下午",
  "dcfcafd0-84fc-4c3b-a5cb-da9a56e29655": "第二周第一天上午",
  "c8c0cf86-fca0-4a17-a2cd-31dad299922e": "第二周第一天下午",
  "3a13c383-5a97-453b-80c4-5cdd370b5145": "第二周第二天",
  "5fe9e41f-5098-488d-a8e7-aa84496bca87": "第二周第二天",
  "6cefb71c-3f71-4af9-9e8d-de86dc63087e": "第二周第三天",
  "080120bd-2058-43c0-8cea-45f6b61146ac": "第二周第四天",
  "c4dea7d7-9b70-44d3-bfc2-e69110dc3572": "第二周第五天",
  "5a428fa0-5721-4541-8aea-c08477eff30d": "第二周第五天",
  "4ea2ff4a-c838-48c6-911d-2673137bca52": "第二周第五天",
  "ea1f2946-b5d7-43bf-866c-18c2b1da953e": "第二周第六天",
  "650fb4a3-0fe2-4fd7-8873-0b2c0d5db684": "第一周第五天下午",
  "39fa3ab0-6b2c-4a8c-a3ae-58f38163366c": "第一周第七天上午",
  "0cff6357-f6e3-4e7c-924c-b7a7abed749c": "第一周第七天上午",
  "d104514d-8dbf-4d65-8211-6e2176802ed9": "第一周第七天下午",
  "c4fe101a-83e4-4af5-8af6-94876a244664": "第二周第一天上午",
  "83372e8b-3dd2-44b3-8289-94469db517c1": "第二周第一天上午",
  "5f8aa7ac-7eb7-490a-8180-c61fb9ac9efd": "第二周第一天下午",
  "e55bfa2e-36c2-4ac2-a9d2-ad0796b29c16": "第二周第二天",
  "023e6d26-0c42-4d6b-9dcb-3e5e6ee1d764": "第二周第三天",
  "82c64a57-1e82-4b27-befa-16f07c6ad643": "第二周第四天",
  "7c77bea5-3170-4c26-a837-e3a3cdcaf843": "第二周第四天",
  "8bdb2eeb-0202-447c-9472-682dc72a9a25": "第二周第五天",
  "b13c0874-5ea5-4216-8e90-39cc544e4076": "第二周第五天",
  "d95a873f-f7b6-48c2-ac46-c079283b0783": "第二周第五天"
};

// 根据assignment_id获取天数显示文本
export function getAssignmentDayText(assignmentId: string): string {
  return assignmentDayMapping[assignmentId] || '未知天数';
}

// 根据作业对象获取天数显示文本
export function getDayTextFromAssignment(assignment: Assignment): string {
  if (assignment.day_text) {
    return assignment.day_text;
  }
  if (assignment.assignment_id && assignmentDayMapping[assignment.assignment_id]) {
    return assignmentDayMapping[assignment.assignment_id];
  }
  return '未知天数';
}

// 为下拉列表获取所有唯一的天数文本（按时间顺序）
export function getUniqueDayTexts(): string[] {
  const dayTexts = Object.values(assignmentDayMapping);
  const uniqueDayTexts = [...new Set(dayTexts)];
  
  // 定义正确的时间顺序
  const timeOrder = [
    '第一周第一天',
    '第一周第二天上午', 
    '第一周第二天下午',
    '第一周第三天',
    '第一周第四天',
    '第一周第五天上午',
    '第一周第五天下午', 
    '第一周第六天',
    '第一周第七天上午',
    '第一周第七天下午',
    '第二周第一天上午',
    '第二周第一天下午',
    '第二周第二天',
    '第二周第三天',
    '第二周第四天',
    '第二周第五天',
    '第二周第六天'
  ];
  
  // 按预定义顺序排序
  return uniqueDayTexts.sort((a, b) => {
    const aIndex = timeOrder.indexOf(a);
    const bIndex = timeOrder.indexOf(b);
    
    // 如果都在预定义列表中，按索引排序
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    // 如果只有一个在预定义列表中，优先显示
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    // 都不在预定义列表中，按字符串排序
    return a.localeCompare(b);
  });
}

// 根据天数文本获取该天的所有作业
export function getAssignmentsByDayText(dayText: string, allAssignments: Assignment[]): Assignment[] {
  const assignmentIds = Object.entries(assignmentDayMapping)
    .filter(([id, text]) => text === dayText)
    .map(([id]) => id);
  
  return allAssignments.filter(assignment => 
    assignmentIds.includes(assignment.assignment_id)
  );
}

// 格式化日期显示
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('zh-CN');
}

// 获取状态颜色样式
export function getStatusColor(status: string): string {
  switch (status) {
    case '合格':
      return 'bg-green-100 text-green-800';
    case '不合格':
      return 'bg-red-100 text-red-800';
    case '批改中':
    case '待批改':
      return 'bg-yellow-100 text-yellow-800';
    case '批改失败':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// 清理文件名 - 移除中文字符、空格和特殊字符
export function sanitizeFileName(originalName: string): string {
  // 获取文件扩展名
  const extension = originalName.split('.').pop() || '';
  // 移除扩展名后的文件名
  const nameWithoutExt = originalName.replace(`.${extension}`, '');
  // 只保留英文字母、数字、连字符和下划线
  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '');
  // 如果清理后为空，使用默认名称
  const finalName = cleanName || 'file';
  return `${finalName}.${extension}`;
}

// 计算文件总大小（MB）
export function calculateTotalFileSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0) / 1024 / 1024;
}

// 检查文件大小是否超限
export function isFileSizeOverLimit(files: File[], limitMB: number = 6): boolean {
  return calculateTotalFileSize(files) > limitMB;
}