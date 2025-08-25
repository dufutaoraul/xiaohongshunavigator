import { NextRequest, NextResponse } from 'next/server'

// 演示数据
const demoResults = [
  {
    id: 'demo_1',
    title: '超好吃的网红蛋糕制作教程 🍰',
    desc: '今天分享一个超级简单的蛋糕制作方法，新手也能轻松上手！材料简单，步骤清晰，成功率100%',
    user: {
      nickname: '甜品小达人',
      avatar: 'https://via.placeholder.com/40x40/ff69b4/ffffff?text=甜'
    },
    interact_info: {
      liked_count: '1.2w',
      comment_count: '328',
      collected_count: '856'
    },
    cover: {
      url: 'https://via.placeholder.com/300x300/ffb6c1/ffffff?text=蛋糕'
    }
  },
  {
    id: 'demo_2',
    title: '小红书爆款穿搭分享 ✨',
    desc: '分享几套超显气质的日常穿搭，简约不简单，让你轻松成为街头焦点！',
    user: {
      nickname: '时尚博主小美',
      avatar: 'https://via.placeholder.com/40x40/87ceeb/ffffff?text=美'
    },
    interact_info: {
      liked_count: '8.5k',
      comment_count: '256',
      collected_count: '1.2k'
    },
    cover: {
      url: 'https://via.placeholder.com/300x300/87ceeb/ffffff?text=穿搭'
    }
  },
  {
    id: 'demo_3',
    title: '居家收纳神器推荐 🏠',
    desc: '整理了一些超实用的收纳好物，让你的家瞬间变得整洁有序，生活品质up up！',
    user: {
      nickname: '收纳达人',
      avatar: 'https://via.placeholder.com/40x40/98fb98/ffffff?text=家'
    },
    interact_info: {
      liked_count: '6.8k',
      comment_count: '189',
      collected_count: '2.1k'
    },
    cover: {
      url: 'https://via.placeholder.com/300x300/98fb98/ffffff?text=收纳'
    }
  },
  {
    id: 'demo_4',
    title: '超治愈的手工DIY教程 🎨',
    desc: '周末在家做点小手工，既能放松心情又能装饰房间，一举两得！',
    user: {
      nickname: '手工小能手',
      avatar: 'https://via.placeholder.com/40x40/dda0dd/ffffff?text=手'
    },
    interact_info: {
      liked_count: '4.2k',
      comment_count: '145',
      collected_count: '892'
    },
    cover: {
      url: 'https://via.placeholder.com/300x300/dda0dd/ffffff?text=DIY'
    }
  },
  {
    id: 'demo_5',
    title: '健康减脂餐制作指南 🥗',
    desc: '营养师推荐的减脂餐搭配，美味又健康，让你在享受美食的同时轻松瘦身！',
    user: {
      nickname: '健康生活家',
      avatar: 'https://via.placeholder.com/40x40/90ee90/ffffff?text=健'
    },
    interact_info: {
      liked_count: '9.1k',
      comment_count: '312',
      collected_count: '1.8k'
    },
    cover: {
      url: 'https://via.placeholder.com/300x300/90ee90/ffffff?text=减脂餐'
    }
  },
  {
    id: 'demo_6',
    title: '旅行拍照姿势大全 📸',
    desc: '出门旅行不知道怎么拍照？这些姿势让你秒变拍照达人，张张都是大片！',
    user: {
      nickname: '旅行摄影师',
      avatar: 'https://via.placeholder.com/40x40/f0e68c/ffffff?text=拍'
    },
    interact_info: {
      liked_count: '7.3k',
      comment_count: '198',
      collected_count: '1.5k'
    },
    cover: {
      url: 'https://via.placeholder.com/300x300/f0e68c/ffffff?text=拍照'
    }
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { q = '', page = 1, limit = 20 } = body
    
    // 根据关键词过滤演示数据
    let filteredResults = demoResults
    if (q && q.trim()) {
      const keyword = q.trim().toLowerCase()
      filteredResults = demoResults.filter(item => 
        item.title.toLowerCase().includes(keyword) || 
        item.desc.toLowerCase().includes(keyword)
      )
    }
    
    // 分页处理
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedResults = filteredResults.slice(startIndex, endIndex)
    
    return NextResponse.json({
      success: true,
      data: {
        notes: paginatedResults,
        total_count: filteredResults.length,
        page: page,
        page_size: limit,
        keyword: q,
        status: 'demo',
        message: '演示数据 - 后端服务未连接'
      },
      source: 'demo',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('演示搜索API错误:', error)
    return NextResponse.json({
      success: false,
      error: '演示数据加载失败',
      source: 'demo-error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, page, limit })
  })
  
  return POST(postRequest)
}