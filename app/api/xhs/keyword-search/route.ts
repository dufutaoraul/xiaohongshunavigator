// 关键词热门帖子搜索API
// GET /api/xhs/keyword-search?keywords=AI&limit=10
// POST /api/xhs/keyword-search/personalized

import { NextRequest, NextResponse } from 'next/server'
import { keywordSearchService } from '@/lib/xhs-integration/services/keyword-search'

// GET: 根据关键词搜索热门帖子
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const keywords = searchParams.get('keywords')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') as 'popular' | 'latest' || 'popular'
    const useCache = searchParams.get('useCache') !== 'false'

    if (!keywords || keywords.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: '请提供搜索关键词'
      }, { status: 400 })
    }

    console.log('🔍 API调用 - 关键词搜索:', {
      keywords,
      limit,
      sortBy,
      useCache
    })

    const result = await keywordSearchService.searchTrendingPosts(
      keywords.trim(),
      { limit, useCache, sortBy }
    )

    return NextResponse.json({
      success: true,
      data: result,
      message: `找到 ${result.posts.length} 个热门帖子`
    })

  } catch (error) {
    console.error('关键词搜索API错误:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '搜索失败，请稍后重试',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

// POST: 获取学员个性化推荐
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, limit = 10, useCache = true } = body

    if (!student_id) {
      return NextResponse.json({
        success: false,
        error: '请提供学员ID'
      }, { status: 400 })
    }

    console.log('🎯 API调用 - 个性化推荐:', {
      student_id,
      limit,
      useCache
    })

    const result = await keywordSearchService.getPersonalizedRecommendations(
      student_id,
      { limit, useCache }
    )

    return NextResponse.json({
      success: true,
      data: result,
      message: `为学员 ${result.studentInfo.name} 生成了 ${result.recommendations.length} 类关键词推荐`
    })

  } catch (error) {
    console.error('个性化推荐API错误:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取推荐失败，请稍后重试',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}