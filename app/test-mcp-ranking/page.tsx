'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Trophy,
  Users,
  TrendingUp,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Heart,
  MessageCircle,
  Share,
  Bookmark
} from 'lucide-react'

interface StudentPost {
  id: string
  title: string
  description: string
  author: {
    userId: string
    nickname: string
    specialty: string
    student_id: string
  }
  stats: {
    likes: number
    comments: number
    shares: number
    collections: number
  }
  publishTime: string
  url: string
  ranking?: number
  popularity_score?: number
  source?: string
}

interface RankingResult {
  success: boolean
  data: {
    stats: {
      total_posts: number
      total_students: number
      active_students: number
      real_data_students: number
    }
    top_posts: StudentPost[]
    student_summary: Array<{
      name: string
      specialty: string
      posts_count: number
      source: string
    }>
  }
  message: string
}

export default function MCPRankingTestPage() {
  const [rankingData, setRankingData] = useState<RankingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRanking = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/xhs/combined-student-ranking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          limit: 15,
          force_refresh: true
        })
      })

      const data = await response.json()

      if (data.success) {
        setRankingData(data)
      } else {
        setError(data.error || '获取排名失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求失败')
    } finally {
      setLoading(false)
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'mcp':
        return <Badge className="bg-green-500">真实数据</Badge>
      case 'mcp_search':
        return <Badge className="bg-blue-500">搜索适配</Badge>
      case 'mock':
        return <Badge variant="secondary">模拟数据</Badge>
      default:
        return <Badge variant="outline">{source}</Badge>
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`
    }
    return num.toString()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            学员帖子热度排名测试
          </h1>
          <p className="text-muted-foreground">
            测试MCP服务获取AXCF202501开头学员的真实小红书数据
          </p>
        </div>
        <Button
          onClick={fetchRanking}
          disabled={loading}
          size="lg"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <TrendingUp className="w-4 h-4 mr-2" />
          )}
          {loading ? '正在获取数据...' : '获取最新排名'}
        </Button>
      </div>

      {error && (
        <Alert className="border-red-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {rankingData && (
        <>
          {/* 统计信息 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">总帖子数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rankingData.data.stats.total_posts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">参与学员</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rankingData.data.stats.active_students}/{rankingData.data.stats.total_students}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">真实数据</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {rankingData.data.stats.real_data_students}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">数据来源</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">MCP服务</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 学员概览 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                学员数据概览
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rankingData.data.student_summary.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">{student.specialty}</div>
                      <div className="text-sm">帖子数: {student.posts_count}</div>
                    </div>
                    {getSourceBadge(student.source)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* TOP帖子排名 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                TOP{rankingData.data.top_posts.length} 热门帖子排名
              </CardTitle>
              <CardDescription>
                基于点赞、评论、收藏、分享数据的综合热度排名
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankingData.data.top_posts.map((post, index) => (
                  <div
                    key={post.id}
                    className={`border rounded-lg p-4 ${index < 3 ? 'border-yellow-200 bg-yellow-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                            ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'}
                          `}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{post.author.nickname}</div>
                            <div className="text-sm text-muted-foreground">
                              {post.author.student_id} • {post.author.specialty}
                            </div>
                          </div>
                          {getSourceBadge(post.source || 'unknown')}
                        </div>

                        <h3 className="font-medium mb-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {post.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span>{formatNumber(post.stats.likes)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4 text-blue-500" />
                            <span>{formatNumber(post.stats.comments)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bookmark className="w-4 h-4 text-green-500" />
                            <span>{formatNumber(post.stats.collections)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Share className="w-4 h-4 text-purple-500" />
                            <span>{formatNumber(post.stats.shares)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline">
                          热度: {post.popularity_score || 0}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(post.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          查看
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          {new Date(post.publishTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!rankingData && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">开始测试学员排名功能</h3>
            <p className="text-muted-foreground text-center mb-4">
              点击上方按钮获取AXCF202501开头学员的真实小红书数据并进行排名
            </p>
            <Button onClick={fetchRanking}>
              <TrendingUp className="w-4 h-4 mr-2" />
              立即测试
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}