'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

interface Homework {
  id: string
  student_id: string
  student_name: string
  title: string
  content: string
  xiaohongshu_link?: string
  status: 'pending' | 'reviewed' | 'approved' | 'rejected'
  score?: number
  feedback?: string
  submitted_at: string
  reviewed_at?: string
  reviewer?: string
}

export default function HomeworkPage() {
  const { user, isAdmin, isAuthenticated } = useAuth()
  const router = useRouter()
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null)
  const [reviewModal, setReviewModal] = useState(false)
  const [reviewData, setReviewData] = useState({
    score: '',
    feedback: '',
    status: 'reviewed' as 'reviewed' | 'approved' | 'rejected'
  })

  // 权限检查
  useEffect(() => {
    if (!user || !isAuthenticated) {
      router.push('/')
      return
    }
  }, [user, isAuthenticated, router])

  // 加载作业数据
  useEffect(() => {
    if (isAuthenticated) {
      loadHomeworks()
    }
  }, [isAuthenticated, isAdmin])

  const loadHomeworks = async () => {
    try {
      setLoading(true)
      
      // 模拟数据 - 实际应该从API获取
      const mockHomeworks: Homework[] = [
        {
          id: '1',
          student_id: 'AXCF2025040001',
          student_name: '张三',
          title: '第1周作业：个人IP定位分析',
          content: '我的个人IP定位是专注于AI工具应用的职场效率专家...',
          xiaohongshu_link: 'https://www.xiaohongshu.com/explore/123456',
          status: 'pending',
          submitted_at: '2025-01-20T10:30:00Z'
        },
        {
          id: '2',
          student_id: 'AXCF2025040002',
          student_name: '李四',
          title: '第1周作业：个人IP定位分析',
          content: '我的个人IP定位是专注于健康生活方式的分享者...',
          xiaohongshu_link: 'https://www.xiaohongshu.com/explore/789012',
          status: 'reviewed',
          score: 85,
          feedback: '内容很好，建议在标题上更加吸引人',
          submitted_at: '2025-01-19T14:20:00Z',
          reviewed_at: '2025-01-20T09:15:00Z',
          reviewer: '管理员'
        }
      ]

      // 如果是学员，只显示自己的作业
      if (!isAdmin && user) {
        const studentHomeworks = mockHomeworks.filter(hw => hw.student_id === user.student_id)
        setHomeworks(studentHomeworks)
      } else {
        // 管理员可以看到所有作业
        setHomeworks(mockHomeworks)
      }
      
    } catch (error) {
      console.error('Failed to load homeworks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = (homework: Homework) => {
    setSelectedHomework(homework)
    setReviewData({
      score: homework.score?.toString() || '',
      feedback: homework.feedback || '',
      status: homework.status === 'pending' ? 'reviewed' : homework.status as any
    })
    setReviewModal(true)
  }

  const submitReview = async () => {
    if (!selectedHomework) return

    try {
      // 这里应该调用API提交评分
      // const response = await fetch('/api/homework/review', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     homeworkId: selectedHomework.id,
      //     score: parseInt(reviewData.score),
      //     feedback: reviewData.feedback,
      //     status: reviewData.status
      //   })
      // })

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      // 更新本地状态
      setHomeworks(prev => 
        prev.map(hw => 
          hw.id === selectedHomework.id 
            ? {
                ...hw,
                score: parseInt(reviewData.score) || undefined,
                feedback: reviewData.feedback,
                status: reviewData.status,
                reviewed_at: new Date().toISOString(),
                reviewer: user?.name
              }
            : hw
        )
      )

      setReviewModal(false)
      setSelectedHomework(null)
      
    } catch (error) {
      console.error('Failed to submit review:', error)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            📝 {isAdmin ? '作业批改中心' : '我的作业'}
          </h1>
          <p className="text-white/70">
            {isAdmin 
              ? '查看和批改学员提交的作业' 
              : '查看你的作业提交记录和批改结果'
            }
          </p>
        </div>

        {/* 统计信息 - 仅管理员可见 */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass-effect p-6 rounded-xl">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📋</div>
                <div>
                  <p className="text-white/60 text-sm">总作业数</p>
                  <p className="text-2xl font-bold text-white">{homeworks.length}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-effect p-6 rounded-xl">
              <div className="flex items-center">
                <div className="text-3xl mr-4">⏳</div>
                <div>
                  <p className="text-white/60 text-sm">待批改</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {homeworks.filter(hw => hw.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="glass-effect p-6 rounded-xl">
              <div className="flex items-center">
                <div className="text-3xl mr-4">✅</div>
                <div>
                  <p className="text-white/60 text-sm">已批改</p>
                  <p className="text-2xl font-bold text-green-400">
                    {homeworks.filter(hw => hw.status !== 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="glass-effect p-6 rounded-xl">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📊</div>
                <div>
                  <p className="text-white/60 text-sm">平均分</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {homeworks.filter(hw => hw.score).length > 0 
                      ? Math.round(homeworks.filter(hw => hw.score).reduce((sum, hw) => sum + (hw.score || 0), 0) / homeworks.filter(hw => hw.score).length)
                      : '--'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 作业列表 */}
        <div className="glass-effect p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            {isAdmin ? '作业列表' : '我的作业记录'}
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="text-white/60">加载中...</div>
            </div>
          ) : homeworks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <div className="text-white/60">
                {isAdmin ? '暂无作业提交' : '你还没有提交任何作业'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {homeworks.map((homework) => (
                <div key={homework.id} className="bg-white/5 rounded-lg border border-white/10 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-xl font-bold text-white">{homework.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          homework.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          homework.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                          homework.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {homework.status === 'pending' ? '待批改' :
                           homework.status === 'approved' ? '已通过' :
                           homework.status === 'rejected' ? '需修改' :
                           '已批改'}
                        </span>
                      </div>
                      
                      {isAdmin && (
                        <p className="text-white/60 mb-2">
                          学员：{homework.student_name} ({homework.student_id})
                        </p>
                      )}
                      
                      <p className="text-white/80 mb-3 line-clamp-2">{homework.content}</p>
                      
                      {homework.xiaohongshu_link && (
                        <a 
                          href={homework.xiaohongshu_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-pink-400 hover:text-pink-300 text-sm mb-3"
                        >
                          🔗 查看小红书链接
                        </a>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-white/60">
                        <span>提交时间：{new Date(homework.submitted_at).toLocaleString('zh-CN')}</span>
                        {homework.reviewed_at && (
                          <span>批改时间：{new Date(homework.reviewed_at).toLocaleString('zh-CN')}</span>
                        )}
                      </div>
                      
                      {homework.score && (
                        <div className="mt-3">
                          <span className="text-lg font-bold text-blue-400">得分：{homework.score}/100</span>
                        </div>
                      )}
                      
                      {homework.feedback && (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg">
                          <p className="text-white/80 text-sm">
                            <span className="font-medium text-white">批改意见：</span>
                            {homework.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {isAdmin && (
                      <div className="ml-6">
                        <button
                          onClick={() => handleReview(homework)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-300"
                        >
                          {homework.status === 'pending' ? '批改' : '修改评分'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 批改模态框 */}
      {reviewModal && selectedHomework && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">批改作业</h3>
            
            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-2">{selectedHomework.title}</h4>
              <p className="text-white/60 mb-2">
                学员：{selectedHomework.student_name} ({selectedHomework.student_id})
              </p>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-white/80">{selectedHomework.content}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">评分 (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reviewData.score}
                  onChange={(e) => setReviewData(prev => ({ ...prev, score: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                  placeholder="请输入分数"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">批改意见</label>
                <textarea
                  value={reviewData.feedback}
                  onChange={(e) => setReviewData(prev => ({ ...prev, feedback: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 resize-none"
                  placeholder="请输入批改意见..."
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">状态</label>
                <select
                  value={reviewData.status}
                  onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="reviewed">已批改</option>
                  <option value="approved">通过</option>
                  <option value="rejected">需修改</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-8">
              <button
                onClick={submitReview}
                className="flex-1 cosmic-button px-6 py-3 rounded-lg font-medium"
              >
                提交批改
              </button>
              <button
                onClick={() => setReviewModal(false)}
                className="flex-1 px-6 py-3 text-white/70 hover:text-white border border-white/30 hover:border-white/50 rounded-lg transition-all duration-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}