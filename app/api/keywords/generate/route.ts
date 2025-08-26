import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 简单的中文分词实现（替代 segment 库）
function simpleChineseSegment(text: string): string[] {
  // 移除标点符号和特殊字符
  const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')

  // 按空格分割
  const words = cleanText.split(/\s+/).filter(word => word.length > 0)

  // 简单的中文词汇分割（基于常见词汇模式）
  const result: string[] = []

  words.forEach(word => {
    if (/^[\u4e00-\u9fa5]+$/.test(word)) {
      // 中文词汇，尝试分割
      if (word.length <= 4) {
        result.push(word)
      } else {
        // 长词汇分割为2-4字的子词
        for (let i = 0; i < word.length; i++) {
          for (let len = 2; len <= Math.min(4, word.length - i); len++) {
            const subWord = word.substr(i, len)
            if (subWord.length >= 2) {
              result.push(subWord)
            }
          }
        }
      }
    } else if (/^[a-zA-Z]+$/.test(word) && word.length >= 2) {
      // 英文词汇
      result.push(word.toLowerCase())
    }
  })

  return Array.from(new Set(result))
}

// 停用词列表
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '他', '她', '它', '们', '这个', '那个', '什么', '怎么', '为什么', '因为', '所以', '但是', '然后', '还是', '或者', '如果', '虽然', '虽说', '不过', '只是', '只要', '就是', '而且', '并且', '以及', '以后', '以前', '现在', '今天', '明天', '昨天', '时候', '时间', '地方', '方面', '问题', '东西', '事情', '工作', '生活', '学习', '可以', '应该', '需要', '想要', '希望', '觉得', '认为', '知道', '了解', '发现', '出现', '开始', '结束', '进行', '完成', '实现', '达到', '得到', '拿到', '做到', '成为', '变成', '形成', '产生', '发生', '出来', '起来', '下来', '过来', '回来', '带来', '拿来', '用来', '作为', '通过', '根据', '按照', '依据', '基于', '关于', '对于', '由于', '为了', '除了', '包括', '含有', '具有', '拥有', '存在', '位于', '处于', '属于', '来自', '来源', '来到', '到达', '到了', '去了', '走了', '回了', '来了', '出了', '进了', '上了', '下了', '过了', '完了', '好了', '行了', '对了', '是的', '不是', '没错', '当然', '确实', '真的', '假的', '可能', '也许', '大概', '估计', '差不多', '几乎', '基本', '主要', '重要', '关键', '核心', '中心', '焦点', '重点', '要点', '特点', '优点', '缺点', '好处', '坏处', '利益', '损失', '收益', '成本', '价格', '费用', '花费', '支出', '投入', '产出', '效果', '结果', '后果', '影响', '作用', '功能', '用途', '目的', '意义', '价值', '意思', '含义', '内容', '信息', '消息', '新闻', '报道', '文章', '资料', '数据', '材料', '素材', '内容', '话题', '主题', '题目', '标题', '名称', '名字', '称呼', '叫做', '名为', '被称为', '号称', '据说', '听说', '看到', '见到', '遇到', '碰到', '找到', '发现', '注意', '观察', '研究', '分析', '讨论', '交流', '沟通', '联系', '接触', '合作', '配合', '协调', '组织', '安排', '计划', '准备', '开展', '举行', '进行', '实施', '执行', '操作', '处理', '解决', '应对', '面对', '对待', '处置', '安置', '放置', '设置', '建立', '创建', '制作', '生产', '制造', '加工', '处理', '改造', '改进', '改善', '提高', '增加', '减少', '降低', '提升', '上升', '下降', '增长', '减少', '扩大', '缩小', '放大', '缩减', '延长', '缩短', '加快', '减慢', '加速', '减速', '促进', '推动', '推进', '发展', '进步', '提升', '改善', '优化', '完善', '健全', '规范', '标准', '要求', '条件', '情况', '状态', '状况', '现状', '趋势', '方向', '目标', '任务', '使命', '责任', '义务', '权利', '权力', '能力', '水平', '程度', '范围', '规模', '大小', '多少', '数量', '质量', '品质', '档次', '等级', '级别', '层次', '阶段', '步骤', '过程', '流程', '程序', '方法', '方式', '途径', '手段', '工具', '设备', '器材', '用品', '物品', '商品', '产品', '服务', '项目', '活动', '事件', '现象', '情形', '场面', '场景', '环境', '条件', '因素', '元素', '成分', '部分', '方面', '角度', '观点', '看法', '意见', '建议', '提议', '想法', '思路', '思想', '理念', '概念', '原理', '道理', '逻辑', '规律', '法则', '原则', '标准', '准则', '规则', '制度', '政策', '法律', '法规', '条例', '规定', '要求', '指示', '指导', '指引', '说明', '解释', '介绍', '描述', '叙述', '讲述', '表达', '表示', '表明', '显示', '反映', '体现', '证明', '说明', '表达', '传达', '传递', '传播', '宣传', '推广', '普及', '扩散', '传授', '教授', '教导', '指导', '培训', '训练', '练习', '实践', '体验', '感受', '体会', '理解', '掌握', '学会', '学到', '获得', '取得', '达成', '实现', '完成', '做好', '搞好', '弄好', '处理好', '解决好', '应对好', '面对好', '对待好', '安排好', '组织好', '协调好', '配合好', '合作好', '交流好', '沟通好', '联系好', '接触好', '建立好', '创建好', '制作好', '生产好', '制造好', '加工好', '改造好', '改进好', '改善好', '提高好', '增加好', '减少好', '降低好', '提升好', '发展好', '进步好', '优化好', '完善好', '健全好', '规范好'
])

// AI相关热门关键词库
const AI_KEYWORDS = [
  // AI工具类
  'ChatGPT', 'GPT4', 'Claude', 'Midjourney', 'Stable Diffusion', 'DALL-E',
  'Notion AI', 'Copilot', 'Gemini', 'Bard', 'Poe', 'Character AI',
  'Runway', 'Luma AI', 'Suno AI', 'ElevenLabs', 'Synthesia',

  // AI技术类
  '人工智能', '机器学习', '深度学习', '神经网络', '自然语言处理',
  '计算机视觉', '语音识别', '图像生成', '文本生成', '代码生成',
  '智能助手', '自动化', '算法', '模型训练', '提示词工程',

  // AI应用场景
  'AI绘画', 'AI写作', 'AI编程', 'AI视频', 'AI音乐', 'AI设计',
  'AI翻译', 'AI客服', 'AI教育', 'AI办公', 'AI营销', 'AI创作',

  // 最新热门
  'Sora', 'GPT5', 'AGI', '多模态AI', 'AI Agent', 'RAG',
  'LoRA', 'ComfyUI', 'LangChain', 'AutoGPT', 'AI换脸', 'AI声音克隆'
]

// 通用热门关键词
const GENERAL_KEYWORDS = [
  '效率提升', '工作技巧', '学习方法', '生产力工具', '时间管理',
  '职场技能', '副业赚钱', '创业', '自媒体', '内容创作',
  '数字化', '科技', '互联网', '新媒体', '社交媒体'
]

interface KeywordScore {
  keyword: string
  score: number
  sources: string[]
}

// 智能生成AI相关关键词
function generateAIKeywords(themeText: string): string[] {
  const text = themeText.toLowerCase()
  const matchedKeywords: string[] = []

  // 检查主题文本中是否包含AI相关内容
  const hasAIContent = AI_KEYWORDS.some(keyword =>
    text.includes(keyword.toLowerCase()) ||
    text.includes(keyword.replace(/[A-Z]/g, '').toLowerCase())
  )

  if (hasAIContent) {
    // 如果包含AI内容，从AI关键词库中选择相关的
    AI_KEYWORDS.forEach(keyword => {
      const keywordLower = keyword.toLowerCase()
      if (text.includes(keywordLower) ||
          text.includes(keywordLower.replace(/[^a-z0-9]/g, '')) ||
          // 模糊匹配
          (keyword.length > 3 && text.includes(keyword.substring(0, 3).toLowerCase()))) {
        matchedKeywords.push(keyword)
      }
    })

    // 如果匹配的关键词少于3个，添加热门AI关键词
    if (matchedKeywords.length < 3) {
      const hotAIKeywords = ['ChatGPT', 'AI工具', 'AI绘画', 'AI写作', 'AI办公', 'Midjourney', 'AI创作']
      hotAIKeywords.forEach(keyword => {
        if (!matchedKeywords.includes(keyword) && matchedKeywords.length < 3) {
          matchedKeywords.push(keyword)
        }
      })
    }
  } else {
    // 如果不包含AI内容，推荐最热门的AI关键词
    const recommendedKeywords = ['ChatGPT', 'AI工具', 'AI创作']
    matchedKeywords.push(...recommendedKeywords)
  }

  return matchedKeywords.slice(0, 3)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, theme_text } = body

    if (!student_id || !theme_text) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id and theme_text' },
        { status: 400 }
      )
    }

    console.log('🔑 关键词生成请求:', { student_id, theme_text })

    // 智能生成AI相关关键词
    const aiKeywords = generateAIKeywords(theme_text)

    console.log('🤖 生成的AI关键词:', aiKeywords)

    // 记录搜索日志
    try {
      await supabase
        .from('xhs_search_logs')
        .insert({
          student_id,
          keywords: aiKeywords,
          theme_text,
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Failed to log search:', logError)
    }

    return NextResponse.json({
      success: true,
      keywords: aiKeywords,
      message: `基于主题"${theme_text}"生成了${aiKeywords.length}个AI相关关键词`,
      suggestion: '请从推荐的关键词中选择一个进行搜索，或手动输入其他关键词'
    })

  } catch (error: any) {
    console.error('Keywords generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate keywords', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

// 从文本中提取关键词
function extractKeywordsFromText(text: string): string[] {
  if (!text) return []

  // 使用简单中文分词
  const words = simpleChineseSegment(text)

  // 过滤和处理
  const keywords = words
    .filter((word: string) => {
      // 过滤条件
      if (typeof word !== 'string') return false
      if (word.length < 2) return false // 至少2个字符
      if (word.length > 10) return false // 最多10个字符
      if (STOP_WORDS.has(word)) return false // 不在停用词列表
      if (/^[0-9]+$/.test(word)) return false // 不是纯数字
      return true
    })
    .map((word: string) => word.trim())
    .filter((word: string) => word.length > 0)

  // 去重并返回
  return Array.from(new Set(keywords))
}

// 获取历史热门关键词
function getHistoricalPopularKeywords(searchLogs: any[]): string[] {
  const keywordCount = new Map<string, number>()

  searchLogs.forEach((log: any) => {
    if (log.keywords && Array.isArray(log.keywords)) {
      log.keywords.forEach((keyword: string) => {
        keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1)
      })
    }
  })

  return Array.from(keywordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]: [string, number]) => keyword)
}

// 添加关键词分数
function addKeywordScore(
  keywordScores: Map<string, KeywordScore>,
  keyword: string,
  score: number,
  source: string
) {
  if (!keyword || keyword.length < 2) return

  if (keywordScores.has(keyword)) {
    const existing = keywordScores.get(keyword)!
    existing.score += score
    if (!existing.sources.includes(source)) {
      existing.sources.push(source)
    }
  } else {
    keywordScores.set(keyword, {
      keyword,
      score,
      sources: [source]
    })
  }
}

// 获取默认关键词（兜底）
function getDefaultKeywords(themeText: string): KeywordScore[] {
  const defaults = ['分享', '生活', '日常', '推荐', '好物']

  // 根据主题文本选择相关的默认关键词
  if (themeText.includes('美食') || themeText.includes('吃')) {
    defaults.unshift('美食', '美味')
  } else if (themeText.includes('旅行') || themeText.includes('旅游')) {
    defaults.unshift('旅行', '风景')
  } else if (themeText.includes('穿搭') || themeText.includes('服装')) {
    defaults.unshift('穿搭', '时尚')
  } else if (themeText.includes('护肤') || themeText.includes('化妆')) {
    defaults.unshift('护肤', '美妆')
  }

  return defaults.map((keyword: string) => ({
    keyword,
    score: 0.5,
    sources: ['default']
  }))
}